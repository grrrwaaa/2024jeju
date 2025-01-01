#include <stdio.h>
#include <stdlib.h>
#include <iostream>
#include <time.h>
#include <Windows.h>
#include <algorithm>
#include <thread>
#include <chrono>
#include <string>
#include <cstddef>
#include <Processing.NDI.Lib.h>

#include "inireader.h"

#include "tof.h"

using namespace std;
using namespace hlds;

#define XRES 320
#define YRES 240
#define NUM_CAMERAS 3

struct Sender {
	NDIlib_send_create_t settings;
	NDIlib_send_instance_t sender;
	NDIlib_video_frame_v2_t frame;

	uint8_t ndi_frame_data[YRES*3 * XRES * 4]; // 4 bytes for R G B A

	void create(const char * name, INIReader& config) {
		settings.p_ndi_name = name;
		sender = NDIlib_send_create(&settings);

		frame.xres = YRES*3;
		frame.yres = XRES;
		frame.FourCC = NDIlib_FourCC_video_type_BGRA;  // 4:4:4:4 
		//frame.FourCC = NDIlib_FourCC_video_type_RGBA;  // 4:4:4:4 
		frame.frame_rate_N = 25;
		frame.frame_rate_D = 1;
		frame.picture_aspect_ratio = float(frame.xres)/float(frame.yres);
		frame.frame_format_type = NDIlib_frame_format_type_progressive;
		// The timecode of this frame in 100-nanosecond intervals.
		frame.timecode = 0;  // int64_t
		// // The video data itself.
		frame.p_data = ndi_frame_data;
		// union {	// If the FourCC is not a compressed type, then this will be the inter-line stride of the video data
		// 	// in bytes.  If the stride is 0, then it will default to sizeof(one pixel)*xres.
		// 	int line_stride_in_bytes;
		// 	// If the FourCC is a compressed type, then this will be the size of the p_data buffer in bytes.
		// 	int data_size_in_bytes;
		// };
		frame.line_stride_in_bytes = 0;
		// // Per frame metadata for this frame. This is a NULL terminated UTF8 string that should be in XML format.
		// // If you do not want any metadata then you may specify NULL here.
		// const char* p_metadata; // Present in >= v2.5
		frame.p_metadata = NULL;

		// randomize the memory:
		// for (int r=0; r<frame.yres; r++) {
		// 	for (int c=0; c<frame.xres; c++) {
		// 		for (int i=0; i<4; i++) {
		// 			ndi_frame_data[i + 4*(c + r*frame.xres)] = 0;
		// 			if (i==3) {
		// 				ndi_frame_data[i + 4*(c + r*frame.xres)] = 255;
		// 			}
		// 		}
		// 	}
		// }
	}

	void destroy() {
		NDIlib_send_destroy(sender);
	}
};

struct Sensor {
	Tof * tof;
	// Flags for enable/disable of TOF senders
	bool tofenable;
	// Create instances for reading frames
	FrameDepth * frame_depth;
	Frame3d * frame_3d;

	float mm_min = 0;
	float mm_max = 10000;

	// capture/playback
	char filename[256];
	bool bCapture;
	clock_t capturetime;						//Capture(Record/Replay) start time

	int create(int tofno, const TofInfo * ptofinfo, INIReader& config) {
		printf("sensor create\n");
		tof = new Tof;
		// Create instances for reading frames
		frame_depth = new FrameDepth;
		frame_3d = new Frame3d;

		tofenable = false;

		snprintf(filename, 255, "tof%d.capture", tofno);
		CaptureInfo capinf;
		capinf.path = "";
		capinf.filename = filename;

		if (config.GetBoolean("capture", "doplayback", false)) {
			printf("playback from %s\n", filename);

			if (tof->Open(capinf) != Result::OK){
				std::cout << "playback Tof Open Error" << endl;
				return 1;
			}

		} else 
        
        {
			if (tof->Open(ptofinfo[tofno]) != Result::OK) {
				std::cout << "TOF ID " << ptofinfo[tofno].tofid << " Open Error" << endl;
			} else {

				// Set camera mode(Depth)
				if (tof->SetCameraMode(CameraMode::CameraModeDepth) != Result::OK){
					std::cout << "TOF ID " << tof->tofinfo.tofid << " Set Camera Mode Error" << endl;
					system("pause");
					return -1;
				}

				// Set camera resolution
				if (tof->SetCameraPixel(CameraPixel::w320h240) != Result::OK){
					//		if (tof[tofno].SetCameraPixel((CameraPixel)(tofno % 7)) != Result::OK){
					std::cout << "TOF ID " << tof->tofinfo.tofid << " Set Camera Pixel Error" << endl;
					system("pause");
					return -1;
				}

				int irgain = config.GetInteger("camera", "irgain", 8);
				int distancemode = config.GetInteger("camera", "distancemode", 1);
				int lowcutoff = config.GetInteger("camera", "lowcutoff", 0);
				float farcutoff = config.GetReal("camera", "farcutoff", 0.f);
				bool edgecutoff = config.GetBoolean("camera", "edgecutoff", true);
				bool impulsecutoff = config.GetBoolean("camera", "implusecutoff", true);
				mm_min = config.GetReal("camera", "mm_min", 0);
				mm_max = config.GetReal("camera", "mm_max", 10000);

				if (tof->SetIrGain(irgain) != Result::OK){
					std::cout << "TOF ID " << tof->tofinfo.tofid << " Edge Noise Reduction Error" << endl;
					system("pause");
					return -1;
				}
				if (tof->SetDistanceMode((DistanceMode)distancemode) != Result::OK){
					std::cout << "TOF ID " << tof->tofinfo.tofid << " Edge Noise Reduction Error" << endl;
					system("pause");
					return -1;
				}

				//noise reduction
				if (tof->SetLowSignalCutoff((int)lowcutoff) != Result::OK){
					std::cout << "TOF ID " << tof->tofinfo.tofid << " Edge Noise Reduction Error" << endl;
					system("pause");
					return -1;
				}
				if (tof->SetFarSignalCutoff((float)farcutoff) != Result::OK){
					std::cout << "TOF ID " << tof->tofinfo.tofid << " Edge Noise Reduction Error" << endl;
					system("pause");
					return -1;
				}
				if (tof->SetEdgeSignalCutoff((EdgeSignalCutoff)edgecutoff) != Result::OK){
					std::cout << "TOF ID " << tof->tofinfo.tofid << " Edge Noise Reduction Error" << endl;
					system("pause");
					return -1;
				}
				if (tof->SetImpulseSignalCutoff((ImpulseSignalCutoff)impulsecutoff) != Result::OK){
					std::cout << "TOF ID " << tof->tofinfo.tofid << " Edge Noise Reduction Error" << endl;
					system("pause");
					return -1;
				}

				std::cout << "TOF ID " << tof->tofinfo.tofid << " Run OK" << endl;

				printf("irgain %d distancemode %d lowcutoff %d farcutoff %f edgecutoff %d impulsecutoff %d min %f max %f\n", 
					irgain, distancemode, lowcutoff, farcutoff, edgecutoff, impulsecutoff, mm_min, mm_max);
			}
		}


			
		if (tof->Run() != Result::OK){
			std::cout << "TOF ID " << tof->tofinfo.tofid << " Run Error" << endl;
			system("pause");
			return -1;
		}

		tofenable = true;


		if (config.GetBoolean("capture", "docapture", false)) {
			printf("capturing to %s\n", filename);

			tof->capturetime = 5.f * (60.f); // 5 minutes

			if (tof->CreateCaptureFile(capinf) == Result::OK){

				if (tof->Capture(true) == Result::OK){
					bCapture = true;

					//Capture start time
					capturetime = clock();
				}
				else {
					std::cout << "Capture Start Error" << endl;
				}
			}
			else {
				std::cout << "Create Capture Error (File:" << capinf.filename << ")" << endl;
			}
		} 

		return !tofenable;
	}

	int getFrame(Sender& sender, int channel) {
		if (!tofenable) return -1;

		// Get the latest frame number
		long frameno;
		TimeStamp timestamp;
		tof->GetFrameStatus(&frameno, &timestamp);

		if (frameno != frame_depth->framenumber) {
			// Read a new frame only if frame number is changed(Old data is shown if it is not changed.)
			// Read a frame of depth data
			if (tof->ReadFrame(frame_depth) != Result::OK){
				std::cout << "Tof ReadFrame Error" << endl;
				return -1;
			}
		}

		// if (frame_depth->width != XRES || frame_depth->height != YRES) {
		// 	printf("TOF resolution error %dx%d not %dx%d\n", frame_depth->width, frame_depth->height, XRES, YRES);
		// 	return -1;
		// }

		
		//frame_3d->Convert(frame_depth);

		// frame[tofno].width * frame[tofno].height
		// Reverse(Mirror) mode
		int w = XRES; 
		int h = YRES; 
		for (int y = 0; y < h; y++){
			for (int x = 0; x < w; x++){
				// get pixel from camera
				unsigned short pixel = frame_depth->databuf[y*w + x];
				float mm = frame_depth->CalculateLength(pixel);

				// bad pixels are when pixel == Oxffff
				bool valid = (pixel != 0xFFFF);

				// TofPoint& pt = frame_3d->frame3d[y*w + x];
				// float mm = pt.z;

				float normalized = (mm_max - mm) / (mm_max - mm_min);
				// another validity check:
				valid = valid && normalized <= 1.f && normalized >= 0.f;

				// convert to bits:
				uint8_t grey = 255.f * min(max(normalized, 0.f), 1.f);

				// compute corresponding location in the ndi frame:
				int i = 0;
				// row:
				i += x * sender.frame.xres; // xres cells per row
				i += y + YRES*channel; // horizontal offset in space for each sensor
				i *= 4; // 4 pixels per cell (RGBA)

				// copy this into one channel of our ndi_frame_data:
				sender.ndi_frame_data[i + 0] = valid ? grey : 0;
				sender.ndi_frame_data[i + 1] = valid ? grey : 0;
				sender.ndi_frame_data[i + 2] = valid ? grey : 0;
				sender.ndi_frame_data[i + 3] = 255;
			}
		}

		printf("_");

		return 0;
	}

	void destroy() {
		// Stop and close all TOF senders
		if (tofenable){

			if (bCapture) {
				tof->Capture(false);
			}

			if (tof->Stop() != Result::OK){
				std::cout << "TOF ID " << tof->tofinfo.tofid << " Stop Error" << endl;
				return;
			}
		
			if (tof->Close() != Result::OK){
				std::cout << "TOF ID " << tof->tofinfo.tofid << " Close Error" << endl;
				return;
			}
		}
	}
};


Sender sender;
Sensor sensors[NUM_CAMERAS];
const TofInfo * ptofinfo = nullptr;
TofManager tofm;

int main(int ac, char * av) {
	
    printf("anyong\n");

	bool run = 1;
    bool berror = false;


	INIReader config("config.ini");
	if (config.ParseError() != 0) {
        std::cout << "Can't load 'config.ini'\n";
        return 1;
    }

	if (!NDIlib_initialize()) {
		std::cout << "unable to initialize NDI" << endl;
		system("pause");
		return -1;
	}

    printf("config loaded\n");

	printf("NDI supported cpu? %i %s\n", NDIlib_is_supported_CPU(), NDIlib_version());

	sender.create("TOF_NDI", config);
    printf("NDI sender TOF_NDI created\n");
	
	if (!config.GetBoolean("capture", "doplayback", false)) {

		// Create TofManager
   	 	printf("TOF manager created\n");

		// Open TOF Manager (Read tof.ini file)
		if (tofm.Open() != Result::OK){
			std::cout << "TofManager Open Error (may not be tof.ini file)" << endl;
			system("pause");
			return -1;
		}
   	 	printf("TOF manager opened\n");

		// Get number of TOF sensor and TOF information list
		int numoftof = tofm.GetTofList(&ptofinfo);

		if (numoftof == 0){
			std::cout << "No TOF devices found" << endl;
			system("pause");
			return -1;
		}
	}

	// Open all Tof instances (Set TOF information)
	for (int tofno = 0; tofno < NUM_CAMERAS; tofno++){

		sensors[tofno].create(tofno, ptofinfo, config);
	}

	printf("created all sensors\n");

	// Once Tof instances are started, TofManager is not necessary and closed
	if (tofm.Close() != Result::OK){
		std::cout << "TofManager Close Error" << endl;
		system("pause");
		return -1;
	}

	printf("begin\n");

	try {

		// Main loop(Until q key pushed)
		while (run){

			// Loop for each TOF sensor
			for (int tofno = 0; tofno < NUM_CAMERAS; tofno++){
				Sensor& sensor = sensors[tofno];

				if (sensor.getFrame(sender, tofno)) break;

			}

			printf(".\n");
			
			NDIlib_send_send_video_v2(sender.sender, &sender.frame);
		}

	} catch (std::exception& ex){
		std::cout << ex.what() << std::endl;
	}


	for (int i=0; i<NUM_CAMERAS; i++) {
		sensors[i].destroy();
	}

	sender.destroy();

    return 0;
}