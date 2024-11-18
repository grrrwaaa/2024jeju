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

// let nav = {
//     viewmatrix: mat4.create(),
//     projmatrix: mat4.create(),

//     looky: 0, //Math.PI,
//     lookx: 0,
// }

class App extends Window {

    constructor(options, common) {
        super(options)
        // have to manually install this:
        this.draw = App.prototype.draw
        this.onkey = App.prototype.onkey

        Object.assign(this, {
            common,
            nav: {
                feet: [4, 0, 0],
                lookx: 0,
                looky: Math.PI * 0/4,
                boom: 1,
                fov: 1.4, // radians
            
                move: [0, 0, 0], 
                turn: 0,

                viewmatrix: mat4.create(),
                projmatrix: mat4.create(),
                modelmatrix: mat4.create(),
            },
            shaderman: new Shaderman(gl),
            text: new Text(gl),
            walls: Object.values(this.sources).map(o => {
                return {
                    vao: glutils.createVao(gl, o.room_geom),
                    fbo: o.final_fbo,
                }
            }),
        })
    }

    draw(gl) {
        let { t, dt, frame, dim } = this
        let [ width, height ] = dim
        let { shaderman } = this
        let { nav } = this

        let seconds = 0
        if (sequence._duration) {
            seconds = ((new Date().getTime() / 1000)) % sequence._duration
            if (this.pointer.buttons[1]){ 
                let s = this.pointer.pos[0] * sequence._duration
                timeoffset = s - seconds
            }
            seconds = (seconds + timeoffset  + sequence._duration) % sequence._duration
        } 
        this.common.seconds = seconds

        sequence.step(seconds)


        // update camera:
        let { viewmatrix, projmatrix, modelmatrix } = nav
        {
            if (this.pointer.buttons[0]){ 
                nav.looky += this.pointer.vel[0]*2
                nav.looky += (this.pointer.pos[0]-0.5)*((this.pointer.pos[0]-0.5)* (this.pointer.pos[0]-0.5))*nav.fov*nav.fov/10
                nav.lookx = (this.pointer.pos[1]-0.5)*3
            }

            nav.fov *= 1 + 0.1*this.pointer.scroll[1]
            nav.fov = Math.min(Math.max(nav.fov, 0.3), 2)
            
            nav.looky += nav.turn * dt
            let move = vec3.clone(nav.move)
            vec3.rotateY(move, move, [0, 0, 0], -nav.looky)
            vec3.scaleAndAdd(nav.feet, nav.feet, move, dt)
            
        
            let aspect = width/height
            let NEAR = 0.1
            let FAR = 100
            mat4.perspective(projmatrix, nav.fov, aspect, NEAR, FAR)
            
            let eye_height = 1.8
            let a = (1 - 0.7*Math.sin(t/8))// Math.PI * 1/2

            mat4.identity(viewmatrix)
            mat4.rotateX(viewmatrix, viewmatrix, nav.lookx)
            mat4.translate(viewmatrix, viewmatrix, [0, 0, nav.boom / nav.fov])
            mat4.rotateY(viewmatrix, viewmatrix, nav.looky)
            mat4.translate(viewmatrix, viewmatrix, [-nav.feet[0], -eye_height, -nav.feet[2]])
            
            
            
            
            
            
            
            
            // let fov = 1.4 // radians

            // let NEAR = 0.01
            // let FAR = 300
            // let hs = 0, vs = 0

            // if (this.pointer.buttons[0]){ 
            //     nav.looky += this.pointer.vel[0]*2
            //     nav.lookx = -this.pointer.pos[1]/2
            // }

            // // mat4.frustum(nav.projmatrix, 
            // // 	aspect*fov*NEAR*(-hs-1), 
            // // 	aspect*fov*NEAR*(-hs+1), 
            // // 	fov*NEAR*(-vs-1), 
            // // 	fov*NEAR*(-vs+1), 
            // // 	NEAR, FAR)
            // mat4.perspective(nav.projmatrix, fov, aspect, NEAR, FAR)

            // let a = t/5
            // let eye_height = 1.6
            // mat4.identity(nav.viewmatrix)
            // mat4.translate(nav.viewmatrix, nav.viewmatrix, [0, 0, -4])
            // mat4.rotateX(nav.viewmatrix, nav.viewmatrix, nav.lookx)
            // mat4.translate(nav.viewmatrix, nav.viewmatrix, [0, -eye_height, 0])
            // mat4.rotateY(nav.viewmatrix, nav.viewmatrix, nav.looky)
            // mat4.translate(nav.viewmatrix, nav.viewmatrix, [-4, 0, 8])
            
        }

        gl.viewport(0, 0, width, height);
        gl.clearColor(0.1, 0.1, 0.1, 0.1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST)

        shaderman.shaders.texquad.begin()
        .uniform("u_projmatrix", nav.projmatrix)
        .uniform("u_viewmatrix", nav.viewmatrix)
        .uniform("u_modelmatrix", nav.modelmatrix)

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
        let { nav } = this

        switch (key) {
            case 65: { // a
                nav.move[0] = -down;
                break;    
            }
            case 68: { 
                nav.move[0] = down;
                break;    
            }
            case 264:
            case 83: { 
                nav.move[2] = down;
                break;    
            }
            case 265:
            case 87: { 
                nav.move[2] = -down;
                break;    
            }
            case 262: { // arrows
                nav.turn = down;
                break;    
            }
            case 263: { // arrows
                nav.turn = -down
                break;    
            }
        }

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
