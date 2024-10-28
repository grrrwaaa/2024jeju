const fs = require("fs")
const path = require("path")

const { vec2, vec3, vec4, quat, mat2, mat2d, mat3, mat4} = require("gl-matrix")

const { gl, glfw, glutils, Window, Shaderman, Config } = require("../anode_gl/index.js")
const ndi = require("./ndi.js")

const {
    pngfile2base64string,
    pngfile2texture, 
    base64string2pngfile, 
    texturedata2base64string, 
    texturedata2png, 
    texture2base64string, 
    base64string2texture,
    dataFlipY,
    png2tex,
} = require("./pngtools")

let win_mul = 4
let screenshot = 0
let USE_NDI = 1
let show = 3
let pause = 0
let fullscreen = 0

let shader_init = 1


let lidar_dim = [240*3, 320]

let window = new Window({
    sync: true,
    fullscreen,
    width:  lidar_dim[0]*win_mul,
    height: lidar_dim[1]*win_mul
})

// this is what the LiDAR feeds are written into:
let lidar_fbo = glutils.makeGbuffer(gl, ...lidar_dim, [
	{ float: false, mipmap: false, wrap: gl.BORDER }
]);

let lidar_filter_fbo = glutils.makeGbufferPair(gl, ...lidar_dim, [
	{ float: true, mipmap: false, wrap: gl.BORDER }
]);

const shaderman = new Shaderman(gl)
shaderman.on("reload", () => { shader_init = 1 })
const quad_vao = glutils.createVao(gl, glutils.makeQuad())

function makeCalibration() {
    let geom_combined
    for (let id=0; id<3; id++) {
        const geom = glutils.makeQuad3D({ min: -1, max: 1, div: 4, flipY: false })
        let gmat = mat4.create()
        mat4.scale(gmat, gmat, [-1/3, -1, 1])
        mat4.translate(gmat, gmat, [(id-1)*2, 0, 0])
        glutils.geomTransform(geom, gmat)
        // now we need to transform the texcoords:
        let tmat = mat3.create()
        mat3.scale(tmat, tmat, [4, 4])
        glutils.geomTexTransform(geom, tmat)
        // ok now read in the calibration:
        let calibration = fs.readFileSync(`sensors/calibration${2-id}.txt`, "utf8").split("\n")
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
            geom.texCoords[i] = 1. - (c[1] - 740) / 240   // X
            geom.texCoords[i+1] = 1. - (c[0] - 100) / 320            // Y
            geom.texCoords[i] = (geom.texCoords[i] + 2 - id) / 3   // X
        }
        //console.log(geom.texCoords)
        geom_combined = geom_combined ? glutils.geomAppend(geom_combined, geom) : geom;
    }
    fs.writeFileSync("lidar.obj", glutils.geomToOBJ(geom_combined), "utf8")
}
//makeCalibration()

let lidar_vao = glutils.createVao(gl, glutils.geomFromOBJ(fs.readFileSync("lidar.obj", "utf8"), { soup: true }))

let stream 
if (USE_NDI) {
    stream = ndi(gl, "TOF_NDI")
} else {
    stream = {
        tex: png2tex(gl, "lidar_example.png", true),
        frame: 1
    }
}

window.draw = function() {
	let { t, dt, frame, dim } = this;

    if (pause) return;

    // only process lidar input if we received data:
    if (stream.frame) {
        stream.tex.bind().submit()
        stream.frame = 0

        // first, use the calibration .obj geometry to resample the texture
        lidar_fbo.begin()
        {
            let { width, height, data } = lidar_fbo
            gl.viewport(0, 0, width, height)
            gl.clearColor(0, 0, 0, 1)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST)

            stream.tex.bind()
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
        // this has 2 layers: layer 0 is the output image, layer 1 is for holding state (e.g. background for background subtraction)
        // {
        //     let tmp = lidar_filter_fbo; lidar_filter_fbo = lidar_filter_fbo1; lidar_filter_fbo1 = tmp;
        // }
        lidar_filter_fbo.begin()
        {
            let { width, height, data } = lidar_filter_fbo
            gl.viewport(0, 0, width, height)
            gl.clearColor(0, 0, 0, 1)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST)

            lidar_filter_fbo.bind(0, 0)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            lidar_fbo.bind(0, 1)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
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

        lidar_filter_fbo.bind()
        gl.generateMipmap(gl.TEXTURE_2D)
    }

    

    gl.viewport(0, 0, ...dim);
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST)

    // gl.disable(gl.DEPTH_TEST); 
    // gl.depthMask(false)
    // gl.enable(gl.BLEND)
    // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    

    switch(show) {
        case 1: stream.tex.bind(); break;
        case 2: lidar_fbo.bind(); break;
        case 3: lidar_filter_fbo.bind(); break;
        case 4: lidar_filter_fbo.bind(1, 0); break;

    }

    shaderman.shaders.show.begin()
    quad_vao.bind().draw()

    
    // gl.enable(gl.DEPTH_TEST);
    // gl.depthMask(true)
    
	if (screenshot) {
        let x = 0, y = 0
        let [width, height] = dim
        let data = new Uint8Array(width*height*4)
        gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data)
        // // you could write this into a PNG file:
        const pnglib = require("pngjs").PNG
        let filename = `screenshot.png`
        fs.writeFileSync(filename, pnglib.sync.write({
            width, height,
            data: dataFlipY(data, width, height)
        }))
        console.log("wrote", filename)
		screenshot = 0
    }

    if (Math.floor(t+dt) > Math.floor(t)) {
        console.log(`fps ${1/dt}`)
    }

    shader_init = 0

}


window.onkey = function(key, scan, down, mod) {
	let shift = mod % 2
	let ctrl = Math.floor(mod/2) % 2

    if (down) {

		switch(key) {
			case 32: {
				pause = !pause;  break;
			}
	
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

            

            case 70: { // f
                window.setFullscreen(!window.fullscreen); break;
            }
            // case 82: { // r
			// 	restoreAllState(); break;
			// }
			// case 83: { // s
			// 	saveAllState(); break;
			// }
			case 290: // F1
            case 291:
            case 292:
            case 293:
            case 294:
            case 295:
            case 296:
            case 297:
            case 298:
            case 299: 
            case 300:
            case 301: // F12
            { // F1
                show = key - 289
                console.log("show", show)
				break;
			}
			default: console.log(key, scan, down, mod)
		}
	}
	
	if (shift && down) {
        switch (key) {
            case 83: {  //"s"
                screenshot = 1
            } break;
        }
	}	
}


Window.animate()