#version 330
precision mediump float;

//uniform sampler2D u_tex;

in vec2 v_uv;
in vec3 v_normal;
in vec3 v_pos;
out vec4 out_color;

void main() {
    vec3 normal = normalize(v_normal);
	out_color = vec4(v_uv, 0., 1.);

    // as a grid:
    vec3 p = exp(-10.*fract(abs(v_pos+0.5)));
    //out_color = vec4(p, 1.);

	//out_color = texture(u_tex, v_uv);
    //out_color = vec4(v_pos, 1);
}