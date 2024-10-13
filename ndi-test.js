
const { gl, glfw, Window, glutils, Shaderman } = require("anode_gl")

const ndi = require("./ndi.js")

let window = new Window({})

const shaderman = new Shaderman(gl)
const quad_vao = glutils.createVao(gl, glutils.makeQuad())

let stream = ndi(gl, "TOF_NDI")

window.draw = function() {
	let { t, dt, dim } = this;

    gl.viewport(0, 0, dim[0], dim[1]);
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST)
    
    stream.tex.bind().submit()
    shaderman.shaders.show.begin()
    quad_vao.bind().draw()
}

Window.animate()