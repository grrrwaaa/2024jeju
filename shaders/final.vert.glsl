#version 330
layout(location = 0) in vec3 a_position;
layout(location = 2) in vec2 a_texCoord;

uniform float u_rotate;

out vec2 v_uv;

void main() {

	gl_Position = vec4(a_position.xyz, 1.);

    if (u_rotate > 0.5) {
        v_uv = vec2(a_texCoord.y, 1-a_texCoord);
    } else {
        v_uv = a_texCoord;
    }
}