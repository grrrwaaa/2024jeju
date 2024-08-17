#version 330
#include "math.glsl"

layout(location = 0) in vec3 a_position;
layout(location = 2) in vec2 a_texCoord;

out vec2 v_uv;

void main() {
	gl_Position = vec4(a_position.xy, 0, 1.);
    v_uv = a_texCoord;
}