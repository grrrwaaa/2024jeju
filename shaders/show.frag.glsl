#version 330
precision mediump float;

uniform sampler2D u_tex;

in vec2 v_uv;

layout(location = 0) out vec4 out0;

void main() {
    out0 = vec4(v_uv, 0, 1);
	out0 = texture(u_tex, v_uv);
}