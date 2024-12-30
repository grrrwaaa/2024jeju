#version 330
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_texCoord;
layout(location = 3) in vec4 a_color;

out vec2 v_uv;

void main() {

	gl_Position = vec4(a_position.xyz, 1.);
    v_uv = a_texCoord;
}