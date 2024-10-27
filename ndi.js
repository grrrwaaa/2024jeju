const path = require("path")
const { Worker } = require('worker_threads')

const { gl, glfw, glutils, Window, Shaderman, Config } = require("../anode_gl/index.js")
const { Sender, Receiver } = require("../anode_ndi/index.js")

function makeNDItexture(gl, name, xres=320, yres=240, fps=25) {

    let receiver = new Receiver(name, fps)
    
    let self = {
        xres, yres,
        tex: glutils.createTexture(gl, { 
            width: xres, height: yres 
        }),
        frame: 0,
        receiver: new Receiver(name, fps=25)
    }

    setInterval(function() {
        // it won't wait. If there's no new video frame, it returns null
        let frame = receiver.video()
        if (frame) {
            // frame has xres, yres, bytelength, and data (Uint8Array)
            if (frame.xres != self.xres || frame.yres != self.yres) {
                self.xres = frame.xres
                self.yres = frame.yres

                // recreate texture:
                self.tex = glutils.createTexture(gl, { 
                    channels: 4, 
                    width: self.xres, 
                    height: self.yres
                }).allocate()
            }

            // copy
            self.tex.data.set(frame.data)

            // notify
            self.frame++
        }
    
    }, 1000/fps) 

    return self
}

module.exports = makeNDItexture