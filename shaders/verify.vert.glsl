#version 330
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_texCoord;
layout(location = 3) in vec4 a_color;

uniform vec3 u_wall_u;

out vec2 v_uv;
out vec3 v_normal;
out vec4 v_color;
out mat3 v_xyz2uv;

void main() {

	gl_Position = vec4(a_position.xyz, 1.);
	v_uv = a_texCoord;
    v_normal = normalize(a_normal);
    v_color = a_color;

    vec3 unit_u = normalize(u_wall_u);
    vec3 unit_v = cross(v_normal, unit_u);
    v_xyz2uv = transpose(mat3(unit_u, unit_v, v_normal));
}