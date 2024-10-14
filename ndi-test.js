const fs = require("fs")
const { gl, glfw, Window, glutils, Shaderman } = require("anode_gl")
const { vec2, vec3, vec4, quat, mat2, mat2d, mat3, mat4} = require("gl-matrix")
const ndi = require("./ndi.js")

// convert calibrations to geometries:


let win_mul = 4

let window = new Window({
    width: 240*3*win_mul,
    height: 320*win_mul
})

const shaderman = new Shaderman(gl)
const quad_vao = glutils.createVao(gl, glutils.makeQuad())

function makeCalibrationVao(id=0) {
    const geom = glutils.makeQuad({ min: -1, max: 1, div: 4, flipY: false })

    // now we need to transform the texcoords:
    let tmat = mat3.create()
    mat3.scale(tmat, tmat, [4, 4])
    glutils.geomTexTransform(geom, tmat)

    // ok now read in the calibration:
    let calibration = fs.readFileSync(`sensors/calibration${id}.txt`, "utf8").split("\n")
    // convert to array of coordinates:
    calibration = calibration.slice(3, -1).map(s => s.slice(0, -2).split(" ").map(s => Number(s)))
    //console.log(calibration)
    // convert to 5x5 grid
    let coords = [];
    while(calibration.length) coords.push(calibration.splice(0,5));
    //console.log(coords)
    // replace in texCoords:
    for (let i=0; i<geom.texCoords.length; i+=2) {
        let x = geom.texCoords[i]
        let y = geom.texCoords[i+1]
        let c = coords[x][y]
        //console.log(i, c)
        geom.texCoords[i+1] = (c[0] - 100) / 320
        geom.texCoords[i] = (c[1] - 740) / 240
    }
    //console.log(geom.texCoords)

    return glutils.createVao(gl, geom)
}

let cal_vao0 = makeCalibrationVao(0)


let stream = ndi(gl, "TOF_NDI")

window.draw = function() {
	let { t, dt, dim } = this;

    gl.viewport(0, 0, dim[0], dim[1]);
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST)
    
    stream.tex.bind().submit()
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_BORDER);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_BORDER);
    shaderman.shaders.ndi.begin()
    //quad_vao.bind().draw()
    cal_vao0.bind().draw()
}

Window.animate()