const path = require("path")
const { Worker } = require('worker_threads')


// add to the module search paths:
module.paths.push(path.resolve(path.join(__dirname, "..", "anode_gl")))

const gl = require('gles3.js'),
	glfw = require('glfw3.js'),
    Window = require("window.js"),
	glutils = require('glutils.js'),
	Shaderman = require('shaderman.js'),
	Config = require('config.js')

function makeNDItexture(gl, name) {

    let metadata = []

    let worker = new Worker("./ndi_worker.js", { 
        workerData: { name, metadata }
    })

    let self = {
        tex: glutils.createTexture(gl, { wrap: gl.CLAMP_TO_BORDER }),
        worker,
    }

    worker.on("message", msg => {
        switch(msg.msg) {
            case "metadata": {
                self.metadata = msg.metadata
                break;
            }
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