const { gl, glfw, glutils, Window, Shaderman } = require("../anode_gl/index.js")
const ndi = require("../anode_ndi/index.js")
const { vec2, vec3, vec4, quat, mat2, mat2d, mat3, mat4} = require("gl-matrix")

// anything here is global, will be visible to all apps:
// (I'm surprised that an FBO can be shared, but it seems to work)
let fbo
let shaderman

class App extends Window {

    constructor(options) {
        super(options)
        // have to manually install this:
        this.draw = App.prototype.draw
        
        // i.e. are we the first window to be created? If so, create global resources:
        let fbo = glutils.makeGbufferPair(gl, 200, 200, [
            { float: false, mipmap: false, wrap: gl.REPEAT }, 
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
            fbo
        })
    }

    draw(gl) {
        let { t, dt, frame, dim } = this
        let [ width, height ] = dim
        let { quad_vao, unit_quad_vao, fbo } = this
        let { senders, receivers } = this

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
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            // recv_tex.bind(1)
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            
            shaderman.shaders.demo.begin()
            .uniform("u_tex_network", 1)
            .uniform("u_frame", frame)
            .uniform("u_random", [Math.random(), Math.random(), Math.random(), Math.random()])
            quad_vao.bind().draw()

            receivers.forEach(recv => {
                if (recv.receiver.video_into(recv.tex.data)) {
                    let [w, h] = recv.dim
                    let [x, y] = recv.pos
                        
                    recv.tex.bind().submit()
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

                    let modelmatrix = mat4.create()
                    let projmatrix = mat4.create()

                    //mat4.frustum(projmatrix, 0, fbo.width, 0, fbo.height, -1, 1)
                    mat4.ortho(projmatrix, 0, fbo.width, 0, fbo.height, 0, 1)

                    mat4.translate(modelmatrix, modelmatrix, [x, y, 0])
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
        //fbo.readPixels()  this.sender.send(fbo.readbuffer.data[0], fbo.width, fbo.height)
        fbo.end()

        if (frame % 2 == 0) 
        {
            
            senders.forEach(send => {
                let [x, y] = send.pos
                let [w, h] = send.dim
                gl.getTextureSubImage(fbo.readbuffer.textures[0], 0, x, y, 0, w, h, 1,
                    gl.RGBA, gl.UNSIGNED_BYTE, send.data.byteLength, send.data)
                send.sender.send(send.data, w, h)
            })
        }


        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 1, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST)


        fbo.bind()
        //recv_tex.bind()
        shaderman.shaders.show.begin()
        quad_vao.bind().draw()

        
        if (Math.floor(t+dt) > Math.floor(t)) {
            console.log(`fps ${1/dt}`)

            
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