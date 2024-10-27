const path = require("path")
const { Worker } = require('worker_threads')


const { gl, glfw, glutils, Window, Shaderman, Config } = require("../anode_gl/index.js")

function makeNDItexture(gl, name) {

    let metadata = []
    let status = new Uint32Array(1)

    let worker = new Worker("./ndi_worker.js", { 
        workerData: { name, status, metadata }
    })

    let self = {
        tex: glutils.createTexture(gl, { wrap: gl.CLAMP_TO_BORDER }),
        frame: 0,
        status,
        metadata,
        worker,
    }

    worker.on("message", msg => {
        switch(msg.msg) {
            case "metadata": {
                self.metadata = msg.metadata
                break;
            }
            case "frame": {
                self.frame++
            } break;
            case "properties": {
                console.log("ndi_worker properties", msg)
            
                // reallocate our texture to match:
                self.tex.dispose()
                let tex = glutils.createTexture(gl, { 
                    channels: 4, // or 2 if msg.kind = UYVY?
                    width: msg.xres, 
                    height: msg.yres,
                    filter: gl.LINEAR
                }).allocate()
            
                // replace the video texture data with a sharedarraybuffer
                // so that we can write to it from a worker thread:
                tex.data = new Uint8Array(new SharedArrayBuffer(tex.data.byteLength))
            
                // send this to the worker to write into:
                worker.postMessage({
                    data: tex.data
                })

                self.tex = tex
                break;
            }
        }

        
    })

    return self
}

module.exports = makeNDItexture