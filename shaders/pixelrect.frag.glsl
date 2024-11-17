#version 330
precision mediump float;

#include "lib.glsl"

uniform sampler2D u_tex;
uniform float u_rot;

in vec2 v_uv;

layout(location = 0) out vec4 out0;

void main() {
    out0 = vec4(v_uv, 0, 1);
	out0 = texture(u_tex, v_uv);
    //out0 = vec4(1);

    // rotate the .xy part
    out0.xy = rotate(out0.xy - 0.5, -u_rot) + 0.5;
}