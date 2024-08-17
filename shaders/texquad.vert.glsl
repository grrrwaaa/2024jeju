#version 330
uniform mat4 u_modelmatrix;
uniform mat4 u_viewmatrix;
uniform mat4 u_projmatrix;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_texCoord;

out vec3 v_pos;
out vec2 v_uv;
out vec3 v_normal;

void main() {
	// Multiply the position by the matrix.
	vec3 vertex = a_position.xyz;
    vec4 world = u_modelmatrix * vec4(vertex, 1); 
	v_pos = vec3(world);
	gl_Position = u_projmatrix * u_viewmatrix * world;

	v_uv = a_texCoord;
	v_normal = a_normal;
	v_normal = mat3(u_modelmatrix) * a_normal;
}