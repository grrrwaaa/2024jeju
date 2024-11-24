#version 330
layout(location = 0) in vec3 a_position;
layout(location = 2) in vec2 a_texCoord;

uniform mat4 u_modelmatrix;
uniform mat4 u_projmatrix;

out vec2 v_uv;

void main() {

	gl_Position = u_projmatrix * u_modelmatrix * vec4(a_position.xyz, 1.);
	v_uv = a_texCoord;
}