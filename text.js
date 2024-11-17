const assert = require("assert"),
fs = require("fs"),
path = require("path");

const { vec2, vec3, vec4, quat, mat2, mat2d, mat3, mat4 } = require("gl-matrix")

const { gl, glfw, glutils, Window, Shaderman } = require("../anode_gl/index.js")
const { png2tex } = require("./pngtools.js")

function createSDFFont(gl) {
    let pngpath = path.resolve(path.join(__dirname, "..", "anode_gl", "fonts", "CONSOLATTF.png"))
    let jsonpath = path.resolve(path.join(__dirname, "..", "anode_gl", "fonts", "CONSOLA.TTF-msdf.json"))
	let json = JSON.parse(fs.readFileSync(jsonpath, "utf8"));
	let font = {
		json: json,
		texture: png2tex(gl, pngpath),
		// add to json a quick lookup table by character:
		lookup: {},
		// add a quick scalar factor:
		scale: 1 / json.info.size,
	}
	json.chars.forEach(char => { 
		font.lookup[char.char.toString()] = char; 
		// cache UVs here:
		char.texCoords = vec4.set(vec4.create(),
			char.x / json.common.scaleW,
			char.y / json.common.scaleH,
			(char.x + char.width) / json.common.scaleW,
			(char.y + char.height) / json.common.scaleH
		);	
		// cache quad bounds here:
		char.quad = vec4.set(vec4.create(),
			char.xoffset * font.scale,
			(json.common.base - char.yoffset) * font.scale,
			char.width * font.scale,
			-char.height * font.scale
		); 
	})

	// png.decode(pixels => {
	// 	assert(pixels.length == font.texture.data.length);
	// 	font.texture.data = pixels;
	// 	font.texture.bind().submit()
	// 	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	// 	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	// 	font.texture.unbind();
	// })

	return font;
}

let font
let textquadprogram

const mat4_identity = mat4.create();

class Text {
    count = 0;

    vao = null;
    instances = null;
    message = "";
    modelmatrix = mat4.create();

    constructor(gl) {
        if (!font) font = createSDFFont(gl, "CONSOLATTF.png", "CONSOLA.TTF-msdf.json")
        if (!textquadprogram) {
            textquadprogram = glutils.makeProgram(gl,
                `#version 330
                uniform mat4 u_modelmatrix;
                uniform mat4 u_viewmatrix;
                uniform mat4 u_projmatrix;
                
                // instanced variable:
                in mat4 i_modelmatrix;
                in vec4 i_fontbounds;
                in vec4 i_fontcoord;
                //in vec4 i_color;
                
                // geometry variables:
                in vec3 a_position;
                in vec3 a_normal;
                in vec2 a_texCoord;
                
                out vec4 v_color;
                out vec2 v_uv;
                
                // http://www.geeks3d.com/20141201/how-to-rotate-a-vertex-by-a-quaternion-in-glsl/
                vec3 quat_rotate( vec4 q, vec3 v ){
                    return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
                }
                vec4 quat_rotate( vec4 q, vec4 v ){
                    return vec4(v.xyz + 2.0 * cross( q.xyz, cross( q.xyz, v.xyz ) + q.w * v.xyz), v.w );
                }
                
                void main() {
                    // 2D bounded coordinates of textquad:
                    vec2 p = a_position.xy*i_fontbounds.zw + i_fontbounds.xy; 
                    
                    // Multiply the position by the matrix.
                    vec4 vertex = i_modelmatrix * vec4(p, 0., 1.);
                    gl_Position = u_projmatrix * u_viewmatrix * u_modelmatrix * vertex;
                
                    // if needed:
                    // v_normal = (i_modelmatrix * vec4(0., 0., 1., 1.)).xyz;
                
                    v_color = vec4(1.);
                    // if needed:
                //	v_color = i_color;
                
                    v_uv = mix(i_fontcoord.xy, i_fontcoord.zw, a_texCoord); 
                }
                `,
                `#version 330
                precision mediump float;
                uniform sampler2D u_texture;
                in vec4 v_color;
                in vec2 v_uv;
                out vec4 outColor;
                
                float median(float r, float g, float b) {
                        return max(min(r, g), min(max(r, g), b));
                }
                float aastep(float threshold, float value) {
                    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
                    return smoothstep(threshold-afwidth, threshold+afwidth, value);
                }
                
                void main() {
                    vec3 sample = texture(u_texture, v_uv).rgb;
                    float sigDist = median(sample.r, sample.g, sample.b) - 0.5;
                    float alpha = clamp(sigDist/fwidth(sigDist) + 0.5, 0.0, 1.0);
                    outColor = v_color * alpha;
                }
                `);
        }


        // create a VBO & friendly interface for the instances:
        // TODO: could perhaps derive the fields from the vertex shader GLSL?
        this.instances = glutils.createInstances(gl, [
            { name: "i_modelmatrix", components: 16 },
            { name: "i_fontbounds", components: 4 },
            { name: "i_fontcoord", components: 4 },
        //	{ name: "i_color", components: 4 },
        ])

        // bind instance VBO to VAO:
        this.vao = glutils.createVao(gl, glutils.makeQuad({ min:0., max:1, div:8 }), textquadprogram.id);
        this.instances.attachTo(this.vao);
    }

    clear() {
        this.count = 0;
        this.message = ""
        return this;
    }

    write(message) {
        if (this.message) this.message += "\n"
        this.message += message
        return this
    }
    
    submit() {
        this.count = 0
        let message = this.message
        
        let idx = this.count
        // reallocate if necessary:
        this.instances.allocate(idx + message.length);
        // the .instances provides a convenient interface to the underlying arraybuffer
        let x = 0;
        let y = 0;
        for (var i = 0; i < message.length; i++) {
            let c = message.charAt(i).toString();
            // space characters don't render, just update cursor:
            if (c === " ") {
                x += font.lookup[" "].xadvance * font.scale;
            } else if (c === "\t") {
                x += font.lookup[" "].xadvance * font.scale * 3;
            } else if (c === "\n") {
                x = 0;
                y -= font.json.common.lineHeight * font.scale;
            } else {
                const char = font.lookup[c];
                if (!char) {
                    console.error("couldn't find character: ", c, typeof(c));
                    continue;
                }
                // get instance interface for this character:
                let obj = this.instances.instances[idx];
                // the anchor coordinate system for the text:
                mat4.copy(obj.i_modelmatrix, this.modelmatrix);
                // color:
    //			vec4.set(obj.i_color, 1, 1, 1, 1)
                // bounding coordinates of the quad for this character:
                vec4.copy(obj.i_fontbounds, char.quad);
                // offset by character location:
                obj.i_fontbounds[0] += x;
                obj.i_fontbounds[1] += y;
                // UV coordinates for this character:	
                vec4.copy(obj.i_fontcoord, char.texCoords);
                // next instance:
                idx++; 
                // update cursor:
                x += char.xadvance * font.scale;
            }
        }

        this.count = idx;

        // submit VBO and attach to VAO:
        this.instances.bind().submit().unbind()
        return this;
    }

    // make sure to submit first
    // recommend using blending
    draw(options) {
        options = Object.assign({
            projmatrix:mat4_identity, 
            viewmatrix:mat4_identity, 
            modelmatrix:mat4_identity
        }, options)
        font.texture.bind(0)
        textquadprogram.begin();
        textquadprogram.uniform("u_modelmatrix", options.modelmatrix);
        textquadprogram.uniform("u_viewmatrix", options.viewmatrix);
        textquadprogram.uniform("u_projmatrix", options.projmatrix);
        this.vao.bind().drawInstanced(this.count).unbind()
        textquadprogram.end();
        return this;
    }
}

module.exports = Text