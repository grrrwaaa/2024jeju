const { workerData, parentPort } = require('worker_threads')

//const grandiose = require('grandiose');
const grandiose = require("../grandiose/index.js")
console.log(grandiose.version(), grandiose.isSupportedCPU())


let timeout = 2000; // Optional timeout, default is 10000ms

const finder = new grandiose.GrandioseFinder({
    // Should sources on the same system be found?
    showLocalSources: true,
    // Show only sources in a named group. May be an array.
    //groups: "studio3",
    // Specific IP addresses or machine names to check
    // These are possibly on a different VLAN and not visible over MDNS
    //extraIPs: [ "192.168.1.122", "mixer.studio7.zbc.com" ]
  })

let targetData
let metadata = workerData.metadata

let xres, yres

parentPort.on("message", msg => {
    targetData = msg.data
})

async function run() {
    console.log("searching for source", workerData.name)

    let receiver
    let sources = finder.getCurrentSources()
	//console.log("NDI sources", sources)

    source = sources[0]
    if (workerData.name) source = sources.find(v => v.name.includes(workerData.name))
    
    if (source) {
        console.log("found NDI source", source)

        receiver = await grandiose.receive({ 
            source,
            // Preferred colour space - without and with alpha channel
            // One of COLOR_FORMAT_RGBX_RGBA, COLOR_FORMAT_BGRX_BGRA,
            //   COLOR_FORMAT_UYVY_RGBA, COLOR_FORMAT_UYVY_BGRA or
            //   the default of COLOR_FORMAT_FASTEST
            //colorFormat: grandiose.COLOR_FORMAT_BGRX_BGRA,
            //colorFormat: grandiose.COLOR_FORMAT_BGRX_RGBA,
            colorFormat: grandiose.COLOR_FORMAT_UYVY_RGBA,
            //colorFormat: grandiose.COLOR_FORMAT_UYVY_BGRA,
            //colorFormat: grandiose.COLOR_FORMAT_FASTEST, // default
            // Select bandwidth level. One of grandiose.BANDWIDTH_METADATA_ONLY,
            //   BANDWIDTH_AUDIO_ONLY, BANDWIDTH_LOWEST and the default value
            //   of BANDWIDTH_HIGHEST
            //bandwidth: grandiose.BANDWIDTH_HIGHEST,
            // Set to false to receive only progressive video frames
            //allowVideoFields: true, // default is true
            // An optional name for the receiver, otherwise one will be generated
            //name: "ndi_worker" 
        });
    }
    
    let once = 1
	while (receiver) {
		try {
            if (once) {
			    let videoFrame = await receiver.video(timeout);
                let res = [videoFrame.xres, videoFrame.yres]
                let bytes_per_pixel = videoFrame.lineStrideBytes / videoFrame.xres
                // let data = new Uint8Array(videoFrame.data)
                // //console.log(res, bytes_per_pixel, data)
                once = 0

                // fourCC: 
                // UYVY,
                // UYVA,
                // P216,
                // PA16,
                // YV12,
                // I420,
                // NV12,
                // BGRA,
                // BGRX,
                // RGBA,
                // RGBX,
                const { fourCC, frameFormatType, lineStrideBytes } = videoFrame
                xres = videoFrame.xres
                yres = videoFrame.yres

                let kind = String.fromCharCode((fourCC >> 0) & 255) 
                    + String.fromCharCode((fourCC >> 8) & 255) 
                    + String.fromCharCode((fourCC >> 16) & 255) 
                    + String.fromCharCode((fourCC >> 24) & 255)

                parentPort.postMessage({
                    msg: "properties",
                    xres, yres, frameFormatType, fourCC, kind,
                    bytes_per_pixel: videoFrame.lineStrideBytes / videoFrame.xres
                })
            }

            // let meta = await receiver.metadata(timeout)
            // .then(meta => {
            //     console.log(meta);
            // })
            // .catch(e => {
            //     console.log("frame error")
            //     console.error(e);

            //     receiver = null
            // })

			let frame = await receiver.video(timeout)
            //console.log(frame)
            .then(frame => {
                targetData.set(frame.data)

                //if (xres && yres) {
                    // for (let y=0; y<yres; y++) {
                    //     for (let x=0; x<xres; x++) {
                    //         let c = frame.data[2*(x + y*xres)+1]
                    //         targetData[4*(x + y*xres)] = c
                    //         targetData[4*(x + y*xres)+1] = c
                    //         targetData[4*(x + y*xres)+2] = c
                    //         targetData[4*(x + y*xres)+3] = c
                    //     }
                    // }
                //}

                if (frame.metadata) {
                    parentPort.postMessage({
                        msg: "metadata",
                        metadata: frame.metadata
                    })
                }
            })
            .catch(e => {
                console.log("frame error")
                console.error(e);

                receiver = null
            })
			

		} catch (e) { 
            console.log("receiver error")
            console.error(e); 
            
            receiver = null
        }
	}

    // if we got here, then we have no receiver; time to launch the finder again:
    setTimeout(run, timeout)
}

run()