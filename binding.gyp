{
  "targets": [
    {
        "target_name": "hldstof",
        "sources": [],
        "defines": [],
        "cflags": ["-std=c++11", "-Wall", "-pedantic", "-O3"],
        "include_dirs": [ 
          "<!(node -p \"require('node-addon-api').include_dir\")",
        ],
        "libraries": [],
        "dependencies": [],
        "conditions": [
            ['OS=="win"', {
              "sources": [ "node-hldstof.cpp" ],
              'include_dirs': [
                './data/SDK_hardware/HldsTofSdk.2.3.0vs2015/<(target_arch)/tofsdk/include',
              ],
              'library_dirs': [
                './data/SDK_hardware/HldsTofSdk.2.3.0vs2015/<(target_arch)/tofsdk/dll',
                './data/SDK_hardware/HldsTofSdk.2.3.0vs2015/<(target_arch)/tofsdk/lib'
              ],
              'libraries': [
                  'tofdll.lib'
              ],
              'defines' : [
                'WIN32_LEAN_AND_MEAN',
                'VC_EXTRALEAN'
              ],
              
              "copies": [{
                'destination': './build/<(CONFIGURATION_NAME)/',
                'files': [
                    './data/SDK_hardware/HldsTofSdk.2.3.0vs2013/<(target_arch)/tofsdk/dll/tof12.dll', 
                    './data/SDK_hardware/HldsTofSdk.2.3.0vs2015/<(target_arch)/tofsdk/dll/tof14.dll'
                  ]
              }]
            }],
            ['OS=="mac"', {
              'cflags+': ['-fvisibility=hidden'],
              'xcode_settings': {},
            }],
            ['OS=="linux"', {}],
        ],
    }
  ]
}