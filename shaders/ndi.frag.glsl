#version 330
precision mediump float;

uniform sampler2D u_tex;
uniform float u_calib;

in vec2 v_uv;

layout(location = 0) out vec4 frag_out0;

void main() {
    frag_out0 = vec4(v_uv, 0, 1);
    vec2 uv = vec2(v_uv.y, v_uv.x);
    frag_out0 = texture(u_tex, uv);
    frag_out0 = texture(u_tex, v_uv);
}