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

const scriptname = __filename.slice(__dirname.length + 1, -3)
let export_path = path.join(__dirname, "export")
let export_image_path = path.join(__dirname, "export", "images")
let restore_path = path.join(__dirname, "restore")
for (let path of [restore_path, export_image_path, export_path]) {
    try { fs.mkdirSync(path) } catch(e) {}
}

let pause = 0

let final_dim = [1920, 1080]
let win_div = 2
let export_div = 1
let SDquant = 8
let win_dim = [
	Math.ceil(final_dim[0]/win_div/SDquant)*SDquant,
	Math.ceil(final_dim[1]/win_div/SDquant)*SDquant,
]
let export_dim = [
    Math.ceil(final_dim[0]/export_div/SDquant)*SDquant,
	Math.ceil(final_dim[1]/export_div/SDquant)*SDquant,
]

let window = new Window({
	title: "",
	dim: win_dim,
	//CONTEXT_VERSION_MAJOR: 4, // need gl 4.3 for compute shaders
	//CONTEXT_VERSION_MINOR: 3,
    sync: true,
})

const shaderman = new Shaderman(gl)
const quad_vao = glutils.createVao(gl, glutils.makeQuad3D())

let mipmap = true
let export_gbo = glutils.makeGbuffer(gl, ...export_dim, [
    { float: false, mipmap: mipmap, wrap: gl.CLAMP_TO_EDGE }, // color
    // { float: false, mipmap: mipmap, wrap: gl.CLAMP_TO_EDGE }, // depth
    // { float: false, mipmap: mipmap, wrap: gl.CLAMP_TO_EDGE }, // normal
    // { float: true, mipmap: mipmap, wrap: gl.CLAMP_TO_EDGE }, // flow
    // { float: false, mipmap: mipmap, wrap: gl.CLAMP_TO_EDGE }, // sd
])
let export_gbo_prev = export_gbo.clone(gl)


// restore state:
let state = {
	frame: 0,
	saveFrameID: 0,
	t: 0,
	dt: 1/60,

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
// 	export_gbo.begin()
// 	.readPixels(0)
// 	.readPixels(1)
// 	.readPixels(2)
// 	.readPixels(3)
// 	.end()
// 	fs.writeFileSync(`${restore_path}/color.bin`, Buffer.from(export_gbo.data[0].buffer))
// 	fs.writeFileSync(`${restore_path}/depth.bin`, Buffer.from(export_gbo.data[1].buffer))
// 	fs.writeFileSync(`${restore_path}/normal.bin`, Buffer.from(export_gbo.data[2].buffer))
// 	fs.writeFileSync(`${restore_path}/flow.bin`, Buffer.from(export_gbo.data[3].buffer))
// 	fs.writeFileSync(`${restore_path}/sd.bin`, Buffer.from(export_gbo.data[3].buffer))

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
		// export_gbo.begin()
		// .readPixels(0)
		// .readPixels(1)
		// .readPixels(2)
		// .readPixels(3)
		// .end()
		// export_gbo.data[0].buffer = fs.readFileSync(`${restore_path}/color.bin`).buffer
		// export_gbo.data[1].buffer = fs.readFileSync(`${restore_path}/depth.bin`).buffer
		// export_gbo.data[2].buffer = fs.readFileSync(`${restore_path}/normal.bin`).buffer
		// export_gbo.data[3].buffer = fs.readFileSync(`${restore_path}/flow.bin`).buffer
		// export_gbo.data[3].buffer = fs.readFileSync(`${restore_path}/sd.bin`).buffer
	
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

    // run computes, update buffers

    // render
    {
        let tmp = export_gbo_prev
        export_gbo_prev = export_gbo
        export_gbo = tmp
    }
    export_gbo.begin() 
    {
        const { width, height, data } = export_gbo
        const dim = [width, height]

        gl.viewport(0, 0, ...dim);
        gl.clearColor(0., 0., 0., 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST)

        // bind previous
		export_gbo_prev.bind(0, 0)

        gl.depthMask(false)
        shaderman.shaders.bg.begin()
        quad_vao.bind().draw()
        gl.depthMask(true)


        gl.disable(gl.BLEND)
        gl.enable(gl.DEPTH_TEST)
        gl.depthMask(true)
    }
    export_gbo.end()

	//////////////

	gl.viewport(0, 0, dim[0], dim[1]);
	gl.clearColor(0., 0., 0., 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST)

	// if (showLayer >= 0 && showLayer < 5) {
	// 	if (showCacheQueue && texcache.length) {
	// 		cache_tex[showLayer].bind()
	// 	} else {
	// 		export_gbo.bind(showLayer)
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
	
}

window.onpointerbutton = function(button, action, mods) {
	//console.log(button, action, mods)
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
				window.dim = [final_dim[0]/win_div, final_dim[1]/win_div]
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
