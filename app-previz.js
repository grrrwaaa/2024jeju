const fs = require("fs")
const path = require("path")

const { vec2, vec3, vec4, quat, mat2, mat2d, mat3, mat4} = require("gl-matrix")

const { gl, glfw, glutils, Window, Shaderman } = require("../anode_gl/index.js")
const ndi = require("../anode_ndi/index.js")
const ndi_texture = require("./ndi.js")

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
    }

    draw(gl) {
        let { t, dt, frame, dim } = this
        let [ width, height ] = dim
        let { shaderman } = this

        // update camera:
        {
            let aspect = width/height
            let fov = 1.4 // radians

            let NEAR = 0.01
            let FAR = 300
            let hs = 0, vs = 0

            if (this.pointer.buttons[0]){ 
                nav.looky += this.pointer.vel[0]
                nav.lookx = -this.pointer.pos[1]/3
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
