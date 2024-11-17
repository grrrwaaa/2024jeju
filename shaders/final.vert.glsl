#version 330
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_texCoord;
layout(location = 3) in vec4 a_color;

uniform float u_rotate;

out vec2 v_uv;
out vec3 v_normal;
out vec4 v_color;

void main() {

	gl_Position = vec4(a_position.xyz, 1.);

    v_normal = normalize(a_normal);
    v_color = a_color;

    if (u_rotate > 2.5) {
        v_uv = vec2(1-a_texCoord.y, a_texCoord);
    } else if (u_rotate > 1.5) {
        v_uv = 1 - a_texCoord;
    } else if (u_rotate > 0.5) {
        v_uv = vec2(a_texCoord.y, 1-a_texCoord);
    } else {
        v_uv = a_texCoord;
    }
}