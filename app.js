const fs = require("fs")
const path = require("path")

const { vec2, vec3, vec4, quat, mat2, mat2d, mat3, mat4} = require("gl-matrix")

const { gl, glfw, glutils, Window, Shaderman } = require("../anode_gl/index.js")
const ndi = require("../anode_ndi/index.js")
const ndi_texture = require("./ndi.js")

let shaderman
let show = 1

class App extends Window {

    constructor(options, common) {
        super(options)
        // have to manually install this:
        this.draw = App.prototype.draw
        this.onkey = App.prototype.onkey
        
        // i.e. are we the first window to be created? If so, create global resources:
        let fbo = glutils.makeGbufferPair(gl, options.config.content_res[0], options.config.content_res[1], [
            { float: true, mipmap: false, wrap: gl.CLAMP_TO_EDGE }, 
        ])

        let image_fbo = glutils.makeGbuffer(gl, fbo.width, fbo.height, [
            { float: false, mipmap: false, wrap: gl.CLAMP_TO_EDGE }, 
        ])

        
        shaderman = new Shaderman(gl)

        this.senders.forEach(send => {
            send.sender = new ndi.Sender(send.name)
            send.data = new Uint8Array(4 * send.dim[0] * send.dim[1])
        })

        this.receivers.forEach(recv => {
            recv.receiver = new ndi.Receiver(recv.name)
            recv.tex = glutils.createTexture(gl, { width: recv.dim[0], height: recv.dim[1] }).allocate().bind().submit()
        })



        // VAOs can't be shared between windows, so we have to create one per window:
        Object.assign(this, { 
            quad_vao: glutils.createVao(gl, glutils.makeQuad()),
            unit_quad_vao: glutils.createVao(gl, glutils.makeQuad({ min: 0, max: 1 })),
            image_fbo, fbo,

            common,
            unique: Math.random(),
        })

        // special case for floor:
        if (this.title == "F") {
            Object.assign(this, {
                // this is the lidar data stream over NDI:
                lidar_stream: ndi_texture(gl, "TOF_NDI"),
                // this is what the LiDAR feeds are written into:
                lidar_fbo: glutils.makeGbuffer(gl, ...common.lidar_dim, [
                    { float: false, mipmap: false, wrap: gl.BORDER }
                ]), 
                // this is the calibration geometry for it:
                lidar_vao: glutils.createVao(gl, glutils.geomFromOBJ(fs.readFileSync("lidar.obj", "utf8"), { soup: true })),

                // this is the filtered & processed lidar data
                lidar_filter_fbo: glutils.makeGbufferPair(gl, ...common.lidar_dim, [
                    { float: true, mipmap: false, wrap: gl.BORDER }
                ]), 
            })
        }
    }

    draw(gl) {
        let { t, dt, frame, dim } = this
        let [ width, height ] = dim
        let { quad_vao, unit_quad_vao, image_fbo, fbo } = this
        let { senders, receivers } = this
        let { lidar_stream, lidar_fbo, lidar_filter_fbo, lidar_vao } = this

        const isFloor = (this.title == "F");

        // special case for floor:
        if (isFloor) {
            // only process lidar input if we received data:
            if (lidar_stream.frame) {
                lidar_stream.frame = 0

                // first, use the calibration .obj geometry to resample the texture
                lidar_fbo.begin()
                {
                    let { width, height, data } = lidar_fbo
                    gl.viewport(0, 0, width, height)
                    gl.clearColor(0, 0, 0, 1)
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                    gl.enable(gl.DEPTH_TEST)

                    lidar_stream.tex.bind().submit()
                    // using NEAREST to avoid blending of invalid pixel data
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_BORDER);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_BORDER);
                    shaderman.shaders.show.begin()
                    lidar_vao.bind().draw()
                }
                lidar_fbo.end()

                // next, send this through a feedback process:
                lidar_filter_fbo.begin()
                {
                    let { width, height, data } = lidar_filter_fbo
                    gl.viewport(0, 0, width, height)
                    gl.clearColor(0, 0, 0, 1)
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                    gl.enable(gl.DEPTH_TEST)

                    lidar_filter_fbo.bind(0, 0)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    lidar_fbo.bind(0, 1)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    shaderman.shaders.lidar_filter.begin()
                    .uniform("u_tex0", 0)
                    .uniform("u_tex_input", 1)
                    .uniform("u_resolution", [width, height])
                    quad_vao.bind().draw()
                }
                lidar_filter_fbo.end()
            }
        }

        let received = 0

        // first, overlay in the receivers:
        fbo.begin()
        {
            let { width, height } = fbo
            gl.viewport(0, 0, width, height);
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST)
            gl.depthMask(false)

            fbo.bind()
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            
            shaderman.shaders.show.begin()
            quad_vao.bind().draw()

            receivers.forEach(recv => {
                if (recv.receiver.video_into(recv.tex.data)) {
                    received = 1

                    let [w, h] = recv.dim
                    let [x, y] = recv.pos
                    let a = recv.angle
                        
                    recv.tex.bind().submit()
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

                    let modelmatrix = mat4.create()
                    let projmatrix = mat4.create()

                    //mat4.frustum(projmatrix, 0, fbo.width, 0, fbo.height, -1, 1)
                    mat4.ortho(projmatrix, 0, fbo.width, 0, fbo.height, 0, 1)

                    mat4.translate(modelmatrix, modelmatrix, [x, y, 0])
                    mat4.rotateZ(modelmatrix, modelmatrix, a)
                    mat4.scale(modelmatrix, modelmatrix, [w, h, 1])


                    shaderman.shaders.pixelrect.begin()
                    .uniform("u_modelmatrix", modelmatrix)
                    .uniform("u_projmatrix", projmatrix)
                    unit_quad_vao.bind().draw()
                }
            })

            
            gl.disable(gl.BLEND)
            gl.depthMask(true)
        }
        fbo.end()

        fbo.begin()
        {
            let { width, height } = fbo
            gl.viewport(0, 0, width, height);
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST)
            // gl.enable(gl.BLEND);
            // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.depthMask(false)

            fbo.bind()
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            if (isFloor) {
                lidar_filter_fbo.bind(0,1)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.BORDER);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.BORDER);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            }
            
            shaderman.shaders.demo.begin()
            .uniform("u_tex_lidar", 1)
            .uniform("u_frame", frame)
            .uniform("u_random", [Math.random(), Math.random(), Math.random(), Math.random()])
            .uniform("u_unique", this.unique)
            .uniform("u_use_lidar", +isFloor)
            quad_vao.bind().draw()
            
            gl.disable(gl.BLEND)
            gl.depthMask(true)
        }
        fbo.end()

        image_fbo.begin()
        {
            let { width, height } = image_fbo
            gl.viewport(0, 0, width, height);
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            fbo.bind()
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            
            shaderman.shaders.show.begin()
            quad_vao.bind().draw()
        }
        image_fbo.end()


        if (frame % 2 == 0) 
        {
            senders.forEach(send => {
                let [x, y] = send.pos
                let [w, h] = send.dim
                gl.getTextureSubImage(image_fbo.textures[0], 0, x, y, 0, w, h, 1,
                    gl.RGBA, gl.UNSIGNED_BYTE, send.data.byteLength, send.data)
                send.sender.send(send.data, w, h)
            })
        }

        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0.25, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST)

        image_fbo.bind()
        // if (isFLoor) {
        //     lidar_filter_fbo.bind()
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // }
        shaderman.shaders.final.begin()
        quad_vao.bind().draw()
        
        if (Math.floor(t+dt) > Math.floor(t)) {
            console.log(`fps ${1/dt}`)
        }
    }

    
    onkey(key, scan, down, mod) {
        let shift = mod % 2
        let ctrl = Math.floor(mod/2) % 2

        if (down) {

            switch(key) {
                // case 32: {
                //     pause = !pause; 
                //     console.log("pause", pause)
                //     break;
                // }
        
                case 48: // 0
                case 49: // 1
                case 50:
                case 51:
                case 52:
                case 53:
                case 54:
                case 55:
                case 56:
                case 57: {
                    
                    break;
                }
                // case 61: { // =
                //     win_div = (win_div == 2) ? 4 : 2;
                //     window.dim = [screen_dim[0]/win_div, screen_dim[1]/win_div]
                //     break;
                // }

                case 70: { // f
                    
                    this.setFullscreen(!this.fullscreen);
                    break;
                }
                // case 82: { // r
                //     restoreAllState()
                //     break;
                // }
                // case 83: { // s
                //     saveAllState()
                //     break;
                // }
                
                case 290: 
                case 291:
                case 292:
                case 293:
                case 294:
                case 295:
                { // F1
                    show = key - 290
                    break;
                }
                default: console.log(key, scan, down, mod)
            }
        }

        if (shift && down) {
        }	
    }

}

module.exports = App

if (require.main === module) {
    // this is the main script:
    let app = new App({
        title: "window0"
    })

    Window.syncfps = 60
    Window.animate()
}