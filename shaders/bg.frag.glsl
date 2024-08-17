#version 330
#include "hash.glsl"
precision mediump float;

in vec2 v_uv;

layout(location = 0) out vec4 out_color;

void main() {
    out_color = vec4(v_uv, 0.5, 1);
}