const fs = require("fs")
const path = require("path")

const { vec2, vec3, vec4, quat, mat2, mat2d, mat3, mat4} = require("gl-matrix")

const { gl, glfw, glutils, Window, Shaderman } = require("../anode_gl/index.js")

const Text = require("./text.js")
const Params = require("./params.js")

let sequence = new Params("sequence.js")
let timeoffset = 0

let shaderman
let show = 1

let nav = {
    viewmatrix: mat4.create(),
    projmatrix: mat4.create(),

    looky: 0, //Math.PI,
    lookx: 0,
}

class App extends Window {

    constructor(options, common) {
        super(options)
        // have to manually install this:
        this.draw = App.prototype.draw
        this.onkey = App.prototype.onkey

        this.walls = Object.values(this.sources).map(o => {
            return {
                vao: glutils.createVao(gl, o.room_geom),
                fbo: o.final_fbo,
            }
        })
        this.shaderman = new Shaderman(gl)
        this.text = new Text(gl)
        this.common = common
    }

    draw(gl) {
        let { t, dt, frame, dim } = this
        let [ width, height ] = dim
        let { shaderman } = this

        let seconds = ((new Date().getTime() / 1000)) % sequence._duration
        if (this.pointer.buttons[1]){ 
            let s = this.pointer.pos[0] * sequence._duration
            timeoffset = s - seconds
        }
        seconds = (seconds + timeoffset) % sequence._duration
        this.common.seconds = seconds

        sequence.step(seconds)

        // update camera:
        {
            let aspect = width/height
            let fov = 1.4 // radians

            let NEAR = 0.01
            let FAR = 300
            let hs = 0, vs = 0

            if (this.pointer.buttons[0]){ 
                nav.looky += this.pointer.vel[0]*2
                nav.lookx = -this.pointer.pos[1]/2
            }

            // mat4.frustum(nav.projmatrix, 
            // 	aspect*fov*NEAR*(-hs-1), 
            // 	aspect*fov*NEAR*(-hs+1), 
            // 	fov*NEAR*(-vs-1), 
            // 	fov*NEAR*(-vs+1), 
            // 	NEAR, FAR)
            mat4.perspective(nav.projmatrix, fov, aspect, NEAR, FAR)

            let a = t/5
            let eye_height = 1.6
            mat4.identity(nav.viewmatrix)
            mat4.translate(nav.viewmatrix, nav.viewmatrix, [0, 0, -4])
            mat4.rotateX(nav.viewmatrix, nav.viewmatrix, nav.lookx)
            mat4.translate(nav.viewmatrix, nav.viewmatrix, [0, -eye_height, 0])
            mat4.rotateY(nav.viewmatrix, nav.viewmatrix, nav.looky)
            mat4.translate(nav.viewmatrix, nav.viewmatrix, [-4, 0, 8])
            
        }

        gl.viewport(0, 0, width, height);
        gl.clearColor(0.1, 0.1, 0.1, 0.1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST)

        let modelmatrix = mat4.create()

        shaderman.shaders.texquad.begin()
        .uniform("u_projmatrix", nav.projmatrix)
        .uniform("u_viewmatrix", nav.viewmatrix)
        .uniform("u_modelmatrix", modelmatrix)

        for (let wall of this.walls) {

            wall.fbo.bind()
            wall.vao.bind().draw()
        }



        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        let textmatrix = mat4.create()
        let s = 0.02
        mat4.translate(textmatrix, textmatrix, [-1, 1-s, 0])
        mat4.scale(textmatrix, textmatrix, [s,s,s])
        this.text.clear()
        .write(`fps ${Math.round(1/dt)} seconds ${Math.round(seconds)} ${sequence._name} (${Math.round(100 * seconds/sequence._duration)}%)`)
        .write(JSON.stringify(sequence._current, null, "  "))
        .submit()
        this.text.draw({
            modelmatrix:textmatrix
        })

        gl.disable(gl.BLEND)
    }

    onkey(key, scan, down, mod) {
        let shift = mod % 2
        let ctrl = Math.floor(mod/2) % 2

        if (down) {

            switch(key) {
                case 70: { // f
                    
                    this.setFullscreen(!this.fullscreen);
                    break;
                }
            }
        }
    }

}

module.exports = App
