#define NAPI_DISABLE_CPP_EXCEPTIONS 1

#include <node_api.h> 
#include <napi.h>

#include <assert.h>
#include <stdio.h> 
#include <stdlib.h>
#include <chrono>
#include <thread>
#include <vector>

#include "tof.h"

using namespace hlds;


// Create TofManager
hlds::TofManager tofm;

void test() {
    // Open TOF Manager (Read tof.ini file)
	if (tofm.Open() != Result::OK){
		printf( "TofManager Open Error (may not be tof.ini file)\n");
		return;
	}
}

class Module : public Napi::Addon<Module> {
public:



    Module(Napi::Env env, Napi::Object exports) {

        // any global init here
        test();

        // See https://github.com/nodejs/node-addon-api/blob/main/doc/class_property_descriptor.md
		DefineAddon(exports, {
		// 	// InstanceMethod("start", &Module::start),
		// 	// InstanceMethod("end", &Module::end),
		// 	// //InstanceMethod("test", &Module::test),
		// 	// // InstanceValue
		// 	// // InstanceAccessor
		// 	InstanceAccessor<&Module::devices>("devices"),
		// 	// InstanceAccessor<&Module::Gett>("t"),
		// 	// InstanceAccessor<&Module::GetSamplerate>("samplerate"),
		});
    }

};

NODE_API_ADDON(Module)