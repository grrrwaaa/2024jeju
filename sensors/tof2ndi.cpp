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

	void create(const char * name) {
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

	int create(int tofno, const TofInfo * ptofinfo) {
		tof = new Tof;
		// Create instances for reading frames
		frame_depth = new FrameDepth;

		tofenable = false;

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

			//Edge noise reduction
			if (tof->SetEdgeSignalCutoff(EdgeSignalCutoff::Enable) != Result::OK){
				std::cout << "TOF ID " << tof->tofinfo.tofid << " Edge Noise Reduction Error" << endl;
				system("pause");
				return -1;
			}

			// Start(Start data transferring)
			std::cout << "TOF ID " << tof->tofinfo.tofid << " Run OK" << endl;
			Result ret2 = Result::OK;
			ret2 = tof->Run();
			if (ret2 != Result::OK){
				std::cout << "TOF ID " << tof->tofinfo.tofid << " Run Error" << endl;
				printf("ret: %d\n", ret2);
				system("pause");
				return -1;
			}
			std::cout << "TOF ID " << tof->tofinfo.tofid << " Run OK" << endl;

			tofenable = true;
		}

		return !tofenable;
	}

	int getFrame(Sender& sender, int channel) {
		if (!tofenable) return -1;

		// Get the latest frame number
		long frameno;
		TimeStamp timestamp;
		tof->GetFrameStatus(&frameno, &timestamp);

		if (frameno != frame_depth->framenumber){
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

		// frame[tofno].width * frame[tofno].height
		// Reverse(Mirror) mode
		int w = XRES; 
		int h = YRES; 
		for (int y = 0; y < h; y++){
			for (int x = 0; x < w; x++){
				// get pixel from camera
				unsigned short pixel = frame_depth->databuf[y*w + x];
				float mm = frame_depth->CalculateLength(pixel);

				uint8_t grey = 255.f * float(pixel) / 0xfffe; // * 16;
				grey = 255.f * max(0.f, mm - 5000.f) / 4000.f;

				// compute corresponding location in the ndi frame:
				int i = 0;
				// row:
				i += x * sender.frame.xres; // xres cells per row
				i += y + YRES*channel; // horizontal offset in space for each sensor
				i *= 4; // 4 pixels per cell (RGBA)

				// copy this into one channel of our ndi_frame_data:
				sender.ndi_frame_data[i + 0] = grey;
				sender.ndi_frame_data[i + 1] = grey;
				sender.ndi_frame_data[i + 2] = grey;
				sender.ndi_frame_data[i + 3] = 255;
			}
		}

		return 0;
	}

	void destroy() {
		// Stop and close all TOF senders
		if (tofenable){
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


int main(int ac, char * av) {

	bool run = 1;
    bool berror = false;

    printf("hello\n");

	if (!NDIlib_initialize()) {
		std::cout << "unable to initialize NDI" << endl;
		system("pause");
		return -1;
	}

	printf("NDI supported cpu? %i %s\n", NDIlib_is_supported_CPU(), NDIlib_version());

	sender.create("TOF_NDI");
	
	if (10) {

		// Create TofManager
		TofManager tofm;

		// Open TOF Manager (Read tof.ini file)
		if (tofm.Open() != Result::OK){
			std::cout << "TofManager Open Error (may not be tof.ini file)" << endl;
			system("pause");
			return -1;
		}

		// Get number of TOF sensor and TOF information list
		const TofInfo * ptofinfo = nullptr;
		int numoftof = tofm.GetTofList(&ptofinfo);

		if (numoftof == 0){
			std::cout << "No TOF Sender" << endl;
			system("pause");
			return -1;
		}

		// Open all Tof instances (Set TOF information)
		for (int tofno = 0; tofno < NUM_CAMERAS; tofno++){

			sensors[tofno].create(tofno, ptofinfo);
		}

		// Once Tof instances are started, TofManager is not necessary and closed
		if (tofm.Close() != Result::OK){
			std::cout << "TofManager Close Error" << endl;
			system("pause");
			return -1;
		}

		try {

			// Main loop(Until q key pushed)
			while (run){

				// Loop for each TOF sensor
				for (int tofno = 0; tofno < NUM_CAMERAS; tofno++){
					Sensor& sensor = sensors[tofno];

					if (sensor.getFrame(sender, tofno)) break;

				}
				
				NDIlib_send_send_video_v2(sender.sender, &sender.frame);
			}

		} catch (std::exception& ex){
			std::cout << ex.what() << std::endl;
		}

	} else {

		while(run) {

			for (int tofno=0; tofno < NUM_CAMERAS; tofno++) {
				int channel = tofno;

				// demo test stream:
				int w = XRES; 
				int h = YRES; 
				for (int y = 0; y < h; y++){
					for (int x = 0; x < w; x++){
						uint8_t grey = (rand() % 256);

						// compute corresponding location in the ndi frame:
						int i = 0;
						// row:
						i += x * sender.frame.xres; // xres cells per row
						i += y + YRES*channel; // horizontal offset in space for each sensor
						i *= 4; // 4 pixels per cell (RGBA)

						sender.ndi_frame_data[i+0] = grey;//x/float(XRES); //R
						sender.ndi_frame_data[i+1] = grey;//y/float(YRES);   //G
						sender.ndi_frame_data[i+2] = grey;//rand() % 256;   //B
						sender.ndi_frame_data[i+3] = 255;
					}
				}

				//printf("sent %d\n", tofno);
			}

			NDIlib_send_send_video_v2(sender.sender, &sender.frame);
			//std::this_thread::sleep_for(std::chrono::milliseconds(int(1000./25)));
		}
	}

	for (int i=0; i<NUM_CAMERAS; i++) {
		sensors[i].destroy();
	}

	sender.destroy();

    return 0;
}