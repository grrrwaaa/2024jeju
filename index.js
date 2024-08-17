const assert = require("assert"),
	fs = require("fs"),
	os = require("os"),
	path = require("path")
const { Worker } = require('worker_threads')
const child_process = require('child_process');

const { vec2, vec3, vec4, quat, mat2, mat2d, mat3, mat4} = require("gl-matrix")

// add anode_gl to the module search paths:
module.paths.push(path.resolve(path.join(__dirname, "..", "anode_gl")))

const gl = require('gles3.js'),
	glfw = require('glfw3.js'),
    Window = require("window.js"),
	glutils = require('glutils.js'),
	Shaderman = require('shaderman.js');
const { inherits } = require("util");

const {
	pngfile2base64string,
	pngfile2texture, 
	base64string2pngfile, 
	base64string2data,
	texturedata2base64string, 
	texturedata2png, 
	texture2base64string, 
	base64string2texture,
	png2tex, jpg2tex,
} = require("./pngtools");

const {
    quat_rotate,
    quat_unrotate,
    quat_rotation_to,
    quat_fromAxisAngle,
	wrap, wrap_relative, 
    vec3_wrap, vec3_wrap_relative,
} = glutils

const scriptname = __filename.slice(__dirname.length + 1, -3)
let export_path = path.join(__dirname, "export")
let export_image_path = path.join(__dirname, "export", "images")
let restore_path = path.join(__dirname, "restore")
for (let path of [restore_path, export_image_path, export_path]) {
    try { fs.mkdirSync(path) } catch(e) {}
}

let pause = 0
let pointer = {
    buttons: [0, 0, 0],
    pos: [0, 0],
    vel: [0, 0],
}


let screen_dim = [1920, 1080]
let win_div = 2
let record_div = 1
let SDquant = 8
let win_dim = [
	Math.ceil(screen_dim[0]/win_div/SDquant)*SDquant,
	Math.ceil(screen_dim[1]/win_div/SDquant)*SDquant,
]
let record_dim = [
    Math.ceil(screen_dim[0]/record_div/SDquant)*SDquant,
	Math.ceil(screen_dim[1]/record_div/SDquant)*SDquant,
]
console.log("record_dim", record_dim)

// these are the final output resolutions
// (why are the render resolutions they used different?)
// player1 192.168.100.51 floor
let res_floor = [1920, 3240]
// player3 192.168.100.53 right wall:
let res_wallR = [3840, 2160] // which is made up of:
let res_wallR0 = [3840, 1080]
let res_wallR1 = [3840, 725]
let res_wallR2 = [3840, 355]
// player2 92.168.100.52 left wall:
// left wall is the same res, but there is no L2 (just blank)
let res_wallL = res_wallR // which is made up of:
let res_wallL0 = res_wallR0
let res_wallL1 = res_wallR1
//let res_wallL2 = res_wallR2 // but this is blank.
// Server 192.168.100.54, far wall:
let res_wallF = [1920, 1080]

let window = new Window({
	title: "",
	dim: win_dim,
	//CONTEXT_VERSION_MAJOR: 4, // need gl 4.3 for compute shaders
	//CONTEXT_VERSION_MINOR: 3,
    sync: true,
})

const shaderman = new Shaderman(gl)
const quad_vao = glutils.createVao(gl, glutils.makeQuad3D())
const quad_unit_vao = glutils.createVao(gl, glutils.makeQuad3D({ min: 0 }))

let mipmap = true
let record_gbo = glutils.makeGbuffer(gl, ...record_dim, [
    { float: false, mipmap: mipmap, wrap: gl.CLAMP_TO_EDGE }, // color
    // { float: false, mipmap: mipmap, wrap: gl.CLAMP_TO_EDGE }, // depth
    // { float: false, mipmap: mipmap, wrap: gl.CLAMP_TO_EDGE }, // normal
    // { float: true, mipmap: mipmap, wrap: gl.CLAMP_TO_EDGE }, // flow
    // { float: false, mipmap: mipmap, wrap: gl.CLAMP_TO_EDGE }, // sd
])
//let record_gbo_prev = record_gbo.clone(gl)


// restore state:
let state = {
	frame: 0,
	saveFrameID: 0,
	t: 0,
	dt: 1/60,

    nav: {
        viewmatrix: mat4.create(),
        projmatrix: mat4.create(),

        looky: Math.PI,
        lookx: 0,
    }
} 

function json_sanitizer(key, value) {
	// the replacer function is looking for some typed arrays.
	// If found, it replaces it by a trio
	if ( value instanceof Int8Array         ||
		value instanceof Uint8Array        ||
		value instanceof Uint8ClampedArray ||
		value instanceof Int16Array        || 
		value instanceof Uint16Array       ||
		value instanceof Int32Array        || 
		value instanceof Uint32Array       || 
		value instanceof Float32Array      ||
		value instanceof Float64Array       )
		{
		var replacement = {
			constructor: value.constructor.name,
			data: Array.apply([], value),
			flag: "FLAG_TYPED_ARRAY"
		}
		return replacement;
	}
	return value;
}

function json_resanitizer(key, value) {
	let context = global //typeof window === "undefined" ? global : window;
	// the reviver function looks for the typed array flag
	try{
		if( "flag" in value && value.flag === "FLAG_TYPED_ARRAY"){
			// if found, we convert it back to a typed array
			value = new context[ value.constructor ]( value.data );
			return value
		}
	} catch(e) {}
	// if flag not found no conversion is done
	return value;
}

// save our current state:
function saveAllState(sync) {
// 	// read fields back to CPU:
// 	fluid_tex3d.bind(0).getData();
// 	particle_tex3d.bind(0).getData();
// 	surface_tex3d.bind(0).getData();
// 	// save the volumes:
// 		surface_tex3d.writeFileSync(surface_restore_path)
// 		fluid_tex3d.writeFileSync(fluid_restore_path)
// 		particle_tex3d.writeFileSync(particles_restore_path)

// 	// save gbo textures:
// 	record_gbo.begin()
// 	.readPixels(0)
// 	.readPixels(1)
// 	.readPixels(2)
// 	.readPixels(3)
// 	.end()
// 	fs.writeFileSync(`${restore_path}/color.bin`, Buffer.from(record_gbo.data[0].buffer))
// 	fs.writeFileSync(`${restore_path}/depth.bin`, Buffer.from(record_gbo.data[1].buffer))
// 	fs.writeFileSync(`${restore_path}/normal.bin`, Buffer.from(record_gbo.data[2].buffer))
// 	fs.writeFileSync(`${restore_path}/flow.bin`, Buffer.from(record_gbo.data[3].buffer))
// 	fs.writeFileSync(`${restore_path}/sd.bin`, Buffer.from(record_gbo.data[3].buffer))

	// save other state:
	//fs.writeFileSync(`${restore_path}/state.json`, JSON.stringify(state, json_sanitizer, "    "))
    fs.writeFile(`${restore_path}/state.json`, JSON.stringify(state, json_sanitizer, "    "), () => {})
}


function restoreAllState() {
	
	try {
		// fluid_tex3d.readFileSync(fluid_restore_path)
		// fluid_tex3d_prev.readFileSync(fluid_restore_path)
		// particle_tex3d.readFileSync(particles_restore_path)
		// particle_tex3d_prev.readFileSync(particles_restore_path)
		// surface_tex3d.readFileSync(surface_restore_path)
		// surface_tex3d_prev.readFileSync(surface_restore_path)

		// // do this first to ensure the data buffers exist:
		// record_gbo.begin()
		// .readPixels(0)
		// .readPixels(1)
		// .readPixels(2)
		// .readPixels(3)
		// .end()
		// record_gbo.data[0].buffer = fs.readFileSync(`${restore_path}/color.bin`).buffer
		// record_gbo.data[1].buffer = fs.readFileSync(`${restore_path}/depth.bin`).buffer
		// record_gbo.data[2].buffer = fs.readFileSync(`${restore_path}/normal.bin`).buffer
		// record_gbo.data[3].buffer = fs.readFileSync(`${restore_path}/flow.bin`).buffer
		// record_gbo.data[3].buffer = fs.readFileSync(`${restore_path}/sd.bin`).buffer
	
		//other state:
        let state_path = `${restore_path}/state.json`
        if (fs.existsSync(state_path)) {
		    state = Object.assign(state, JSON.parse(fs.readFileSync(state_path, "utf-8"), json_resanitizer))
        }

		saveFrameID = state.saveFrameID

	} catch(e) {
		console.error(e)
	}
}

restoreAllState()

let params = new Function(fs.readFileSync("params.js", "utf-8"))(state)
let config = new Function(fs.readFileSync("config.js", "utf-8"))(state)

const ips = []
const networks = os.networkInterfaces()
for (const name of Object.keys(networks)) {
    for (const net of networks[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
        if (net.family === familyV4Value && !net.internal) {
            ips.push(net.address)
        }
    }
}
console.log("my IPv4 IPs", ips)
// look for a matching ip in the config


// floor geometry:
let floor_vao, far_wall_vao, left_wall_vao, right_wall_vao

{
    let geom = glutils.makeQuad3D({ min: 0 })
    let modelmatrix = mat4.create()
    mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y, config.meters.z])
    mat4.rotateX(modelmatrix, modelmatrix, -Math.PI/2)
    mat4.translate(modelmatrix, modelmatrix, [0, 0, 0])
    glutils.geomTransform(geom, modelmatrix)
    floor_vao = glutils.createVao(gl, geom)
}
{
    let geom = glutils.makeQuad3D({ min: 0 })
    let modelmatrix = mat4.create()
    mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y, config.meters.z])
    mat4.translate(modelmatrix, modelmatrix, [0, 0, -1])
    glutils.geomTransform(geom, modelmatrix)
    far_wall_vao = glutils.createVao(gl, geom)
}
{
    let geom = glutils.makeQuad3D({ min: 0 })
    let geom2 = glutils.makeQuad3D({ min: 0 })

    let modelmatrix = mat4.create()
    let texmatrix = mat3.create()
    let ytotal = 2160, ywall = 1080, ygable = 725, yroof = 355

    // wall:
    mat3.identity(texmatrix)
    mat3.scale(texmatrix, texmatrix, [1, ywall/ytotal])
    glutils.geomTexTransform(geom, texmatrix)
    mat4.identity(modelmatrix)
    mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y0, config.meters.z])
    mat4.rotateY(modelmatrix, modelmatrix, Math.PI/2)
    glutils.geomTransform(geom, modelmatrix)

    // gable:
    mat3.identity(texmatrix)
    mat3.translate(texmatrix, texmatrix, [0, ywall/ytotal])
    mat3.scale(texmatrix, texmatrix, [1, ygable/ytotal])
    glutils.geomTexTransform(geom2, texmatrix)
    mat4.identity(modelmatrix)
    mat4.translate(modelmatrix, modelmatrix, [0, config.meters.y0, 0])
    mat4.rotateZ(modelmatrix, modelmatrix, -config.meters.a_gable)
    mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y_gable, config.meters.z])
    mat4.rotateY(modelmatrix, modelmatrix, Math.PI/2)
    glutils.geomTransform(geom2, modelmatrix)

    glutils.geomAppend(geom, geom2)
    left_wall_vao = glutils.createVao(gl, geom)
}

{
    let geom = glutils.makeQuad3D({ min: 0 })
    let geom2 = glutils.makeQuad3D({ min: 0 })
    let geom3 = glutils.makeQuad3D({ min: 0 })

    let modelmatrix = mat4.create()
    let texmatrix = mat3.create()
    let ytotal = 2160, ywall = 1080, ygable = 725, yroof = 355

    // wall
    mat3.identity(texmatrix)
    mat3.scale(texmatrix, texmatrix, [1, ywall/ytotal])
    glutils.geomTexTransform(geom, texmatrix)
    mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y0, config.meters.z])
    mat4.translate(modelmatrix, modelmatrix, [1, 0, -1])
    mat4.rotateY(modelmatrix, modelmatrix, -Math.PI/2)
    glutils.geomTransform(geom, modelmatrix)

    // gable:
    mat3.identity(texmatrix)
    mat3.translate(texmatrix, texmatrix, [0, ywall/ytotal])
    mat3.scale(texmatrix, texmatrix, [1, ygable/ytotal])
    glutils.geomTexTransform(geom2, texmatrix)
    mat4.identity(modelmatrix)
    mat4.translate(modelmatrix, modelmatrix, [config.meters.x, config.meters.y0, 0])
    mat4.rotateZ(modelmatrix, modelmatrix, config.meters.a_gable)
    mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y_gable, config.meters.z])
    mat4.translate(modelmatrix, modelmatrix, [0, 0, -1])
    mat4.rotateY(modelmatrix, modelmatrix, -Math.PI/2)
    glutils.geomTransform(geom2, modelmatrix)

    // roof:
    mat3.identity(texmatrix)
    mat3.translate(texmatrix, texmatrix, [0, (ywall+ygable)/ytotal])
    mat3.scale(texmatrix, texmatrix, [1, yroof/ytotal])
    glutils.geomTexTransform(geom3, texmatrix)
    mat4.identity(modelmatrix)
    mat4.translate(modelmatrix, modelmatrix, [config.meters.x_top, config.meters.y, 0])
    mat4.rotateZ(modelmatrix, modelmatrix, Math.PI/2)
    mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.w_top, config.meters.z])
    mat4.translate(modelmatrix, modelmatrix, [0, -1, -1])
    mat4.rotateY(modelmatrix, modelmatrix, -Math.PI/2)
    glutils.geomTransform(geom3, modelmatrix)

    glutils.geomAppend(geom, geom2)
    glutils.geomAppend(geom, geom3)
    right_wall_vao = glutils.createVao(gl, geom)
}


let test_tex = png2tex(gl, "stars.png", true)


window.draw = function() {
	let { dim } = this;

	if (Math.floor(this.t+this.dt) > Math.floor(this.t)) {
	    console.log(`realfps ${1/this.dt} state.frame ${state.frame} `)
        params = new Function(fs.readFileSync("params.js", "utf-8"))({})
	}

	// update time:
    if (!pause) {
		state.frame++
		state.t += state.dt
	}
	let { t, dt, frame, nav } = state;

	if (!pause) {
		// animate
	}

    // update camera:
    {
        const { width, height, data } = record_gbo
        let aspect = width/height
        let fov = 1.4 // radians

        let NEAR = 0.01
        let FAR = 300
        let hs = 0, vs = 0

        if (pointer.buttons[0]){ 
            state.nav.looky += pointer.vel[0]
            state.nav.lookx = -pointer.pos[1]/3
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
        mat4.translate(nav.viewmatrix, nav.viewmatrix, [0, 0, -config.meters.x/2])
        mat4.rotateX(nav.viewmatrix, nav.viewmatrix, state.nav.lookx)
        mat4.translate(nav.viewmatrix, nav.viewmatrix, [0, -eye_height, 0])
        mat4.rotateY(nav.viewmatrix, nav.viewmatrix, state.nav.looky)
        mat4.translate(nav.viewmatrix, nav.viewmatrix, [-config.meters.x/2, 0, config.meters.z/2])
        
    }

    // run computes, update buffers

    // render
    // {
    //     let tmp = record_gbo_prev
    //     record_gbo_prev = record_gbo
    //     record_gbo = tmp
    // }


    // render as a 3D preview
    record_gbo.begin() 
    {
        const { width, height, data } = record_gbo
        const dim = [width, height]

        gl.viewport(0, 0, ...dim);
        gl.clearColor(0., 0., 0., 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST)

        // bind previous
		//record_gbo_prev.bind(0, 0)

        gl.depthMask(false)
        shaderman.shaders.bg.begin()
        quad_vao.bind().draw()
        gl.depthMask(true)

        let modelmatrix = mat4.create()

        
        shaderman.shaders.texquad.begin()
        .uniform("u_projmatrix", nav.projmatrix)
        .uniform("u_viewmatrix", nav.viewmatrix)
        .uniform("u_modelmatrix", modelmatrix)
        test_tex.bind()
        floor_vao.bind().draw()
        far_wall_vao.bind().draw()
        left_wall_vao.bind().draw()
        right_wall_vao.bind().draw()

        gl.disable(gl.BLEND)
        gl.enable(gl.DEPTH_TEST)
        gl.depthMask(true)
    }
    record_gbo.end()

	//////////////

	gl.viewport(0, 0, dim[0], dim[1]);
	gl.clearColor(0., 0., 0., 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST)

	// if (showLayer >= 0 && showLayer < 5) {
	// 	if (showCacheQueue && texcache.length) {
	// 		cache_tex[showLayer].bind()
	// 	} else {
	// 		record_gbo.bind(showLayer)
	// 	}
	// } else {
	// 	lighting_gbo.bind()
	// }

    

	shaderman.shaders.show.begin()
	quad_vao.bind().draw()

	// every few seconds, save all our state
	if (!pause) {
		if (state.frame % 30 == 0) saveAllState()
	}
}

window.onpointermove = function(sx, sy) {
    if (pointer.buttons[0]){ 

	    console.log(pointer.vel)
    }
    pointer.vel[0] = sx - pointer.pos[0]
    pointer.vel[1] = sy - pointer.pos[1]
    pointer.pos[0] = sx
    pointer.pos[1] = sy
}

window.onpointerbutton = function(button, action, mod) {
    let shift = mod % 2
	let ctrl = Math.floor(mod/2) % 2
    pointer.buttons[button] = action
}

window.onkey = function(key, scan, down, mod) {
	let shift = mod % 2
	let ctrl = Math.floor(mod/2) % 2

	if (down) {
		switch(key) {
			case 32: {
				pause = !pause; 
				console.log("pause", pause)
				break;
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
			case 61: { // =
				win_div = (win_div == 2) ? 4 : 2;
				window.dim = [screen_dim[0]/win_div, screen_dim[1]/win_div]
				break;
			}
            case 82: { // r
				restoreAllState()
				break;
			}
			case 83: { // s
				saveAllState()
				break;
			}
			
			case 290: { // F1
				break;
			}
			default: console.log(key, scan, down, mod)
		}
	}

	if (shift && down) {
	}	
}

// pick one:
//Window.syncfps = 60 // use sleep to maintain FPS
Window.sync = true // sync to refresh
Window.animate()
