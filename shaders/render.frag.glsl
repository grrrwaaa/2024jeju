#version 330
precision mediump float;

uniform sampler2D u_tex;

in vec2 v_uv;
in vec3 v_normal;
in vec4 v_color;

vec2 dim = textureSize(u_tex, 0);

layout(location = 0) out vec4 out0;

void main() {
    out0 = vec4(v_uv, 0, 1);
	vec4 input = texture(u_tex, v_uv);
    out0 = input;

    //out0 = vec4(input.xy/dim.xy + 0.5, 0, 1);
    out0 = vec4(input.w);
}