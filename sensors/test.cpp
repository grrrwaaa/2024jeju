#include <stdio.h>
#include <stdlib.h>
#include <iostream>
#include <time.h>
#include <Windows.h>

#include <chrono>
#include <string>
#include <cstddef>
#include <Processing.NDI.Lib.h>

#include "tof.h"

using namespace std;
using namespace hlds;

struct sendCarrier  {
  char* name = nullptr;
  char* groups = nullptr;
  bool clockVideo = false;
  bool clockAudio = false;
  NDIlib_send_instance_t send;
  ~sendCarrier() {
    free(name);
  }
};


int main(int ac, char * av) {

    printf("hello\n");


	if (!NDIlib_initialize()) {
		std::cout << "unable to initialize NDI" << endl;
		system("pause");
		return -1;
	}

	printf("NDI supported cpu? %i %s\n", NDIlib_is_supported_CPU(), NDIlib_version());

	// try to create a sender:
	{
		NDIlib_send_create_t settings;
		settings.p_ndi_name = "TOF_NDI";
		NDIlib_send_instance_t sender = NDIlib_send_create(&settings);

		#define XRES 320
		#define YRES 240

		uint8_t frame_data[YRES * XRES * 4]; // 4 bytes for R G B A

		NDIlib_video_frame_v2_t frame;
		frame.xres = XRES;
		frame.yres = YRES;
		frame.FourCC = NDIlib_FourCC_video_type_RGBA;  // 4:4:4:4 
		frame.frame_rate_N = 25;
		frame.frame_rate_D = 1;
		frame.picture_aspect_ratio = float(XRES)/float(YRES);
		frame.frame_format_type = NDIlib_frame_format_type_progressive;
		// The timecode of this frame in 100-nanosecond intervals.
		frame.timecode = 0;  // int64_t
		// // The video data itself.
		frame.p_data = frame_data;

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

		while (true) {

			// randomize the memory:
			for (int c=0; c<YRES; c++) {
				for (int r=0; r<XRES; r++) {
					for (int i=0; i<4; i++) {
						frame_data[i + 4*(r + c*XRES)] = rand() % 256;
					}
				}
			}

			NDIlib_send_send_video_v2(sender, &frame);
		}

		

		NDIlib_send_destroy(sender);
	}

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
		std::cout << "No TOF Sensor" << endl;
		system("pause");
		return -1;
	}

    // Create Tof instances for TOF sensors
	Tof * tof = new Tof[numoftof];
	// Flags for enable/disable of TOF sensors
	bool * tofenable = new bool[numoftof];
    // Create instances for reading frames
	FrameDepth * frame = new FrameDepth[numoftof];

    // Open all Tof instances (Set TOF information)
	for (int tofno = 0; tofno < numoftof; tofno++){
		if (tof[tofno].Open(ptofinfo[tofno]) != Result::OK){
			std::cout << "TOF ID " << ptofinfo[tofno].tofid << " Open Error" << endl;

			tofenable[tofno] = false;
		}
		else{
			tofenable[tofno] = true;
		}
	}

    // Once Tof instances are started, TofManager is not necessary and closed
	if (tofm.Close() != Result::OK){
		std::cout << "TofManager Close Error" << endl;
		system("pause");
		return -1;
	}

    // Start all Tof instances (Start data transferring)
	for (int tofno = 0; tofno < numoftof; tofno++){

		// Start only enable TOF sensor
		if (tofenable[tofno] == true){

			// Set camera mode(Depth)
			if (tof[tofno].SetCameraMode(CameraMode::CameraModeDepth) != Result::OK){
				std::cout << "TOF ID " << tof[tofno].tofinfo.tofid << " Set Camera Mode Error" << endl;
				system("pause");
				return -1;
			}

			// Set camera resolution
			if (tof[tofno].SetCameraPixel(CameraPixel::w320h240) != Result::OK){
				//		if (tof[tofno].SetCameraPixel((CameraPixel)(tofno % 7)) != Result::OK){
				std::cout << "TOF ID " << tof[tofno].tofinfo.tofid << " Set Camera Pixel Error" << endl;
				system("pause");
				return -1;
			}

			//Edge noise reduction
			if (tof[tofno].SetEdgeSignalCutoff(EdgeSignalCutoff::Enable) != Result::OK){
				std::cout << "TOF ID " << tof[tofno].tofinfo.tofid << " Edge Noise Reduction Error" << endl;
				system("pause");
				return -1;
			}

			// Start(Start data transferring)
			std::cout << "TOF ID " << tof[tofno].tofinfo.tofid << " Run OK" << endl;
			Result ret2 = Result::OK;
			ret2 = tof[tofno].Run();
			if (ret2 != Result::OK){
				std::cout << "TOF ID " << tof[tofno].tofinfo.tofid << " Run Error" << endl;
				printf("ret: %d\n", ret2);
				system("pause");
				return -1;
			}
			std::cout << "TOF ID " << tof[tofno].tofinfo.tofid << " Run OK" << endl;
		}
	}

    // Set color information in each frame
	for (int tofno = 0; tofno < numoftof; tofno++){
		if (tofenable[tofno] == true){
			frame[tofno].CreateColorTable(0, 65530);
		}
	}

    bool berror = false;
    try {

		// Main loop(Until q key pushed)
		while (1){

            // Loop for each TOF sensor
			for (int tofno = 0; tofno < numoftof; tofno++){

				if (tofenable[tofno] == true){
                    // Get the latest frame number
					long frameno;
					TimeStamp timestamp;
					tof[tofno].GetFrameStatus(&frameno, &timestamp);

                    if (frameno != frame[tofno].framenumber){
						// Read a new frame only if frame number is changed(Old data is shown if it is not changed.)
                        // Read a frame of depth data
						if (tof[tofno].ReadFrame(&frame[tofno]) != Result::OK){
							std::cout << "Tof ReadFrame Error" << endl;
							berror = true;
							break;
						}

                        // frame[tofno].width * frame[tofno].height
                        // Reverse(Mirror) mode
						for (int i = 0; i < frame[tofno].height; i++){
							for (int j = 0; j < frame[tofno].width; j++){
                                unsigned short pixel = frame[tofno].databuf[i * frame[tofno].width + (frame[tofno].width - j - 1)];
                                //...

                                
                            }
                        }
                    }
                }
            }
        }
    } catch (std::exception& ex){
		std::cout << ex.what() << std::endl;
	}

    // Stop and close all TOF sensors
	for (int tofno = 0; tofno < numoftof; tofno++){
		if (tofenable[tofno] == true){
			if (tof[tofno].Stop() != Result::OK){
				std::cout << "TOF ID " << tof[tofno].tofinfo.tofid << " Stop Error" << endl;
				berror = true;
			}
		}
	}


	for (int tofno = 0; tofno < numoftof; tofno++){
		if (tofenable[tofno] == true){
			if (tof[tofno].Close() != Result::OK){
				std::cout << "TOF ID " << tof[tofno].tofinfo.tofid << " Close Error" << endl;
				berror = true;
			}
		}
	}

	//delete[] timer;
	delete[] frame;
	delete[] tof;
	delete[] tofenable;
	//delete[] graph;
	//cv::destroyAllWindows();

	if (berror){
		system("pause");
	}

    return 0;
}