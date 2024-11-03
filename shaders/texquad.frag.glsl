#version 330
precision mediump float;

uniform sampler2D u_tex;

in vec2 v_uv;
in vec3 v_normal;
in vec3 v_pos;
out vec4 out_color;

void main() {
    vec3 normal = normalize(v_normal);
	out_color = vec4(v_uv, 0., 1.);

    out_color = mix(out_color, texture(u_tex, v_uv), 1);
	


    if (mod(v_pos.y, 2.) < 1. ^^ mod(v_pos.x, 2.) < 1.^^ mod(v_pos.z, 2.) < 1.) {
	   // out_color = mix(out_color, vec4(v_pos * vec3(1, 1, -1) * 0.1, 1.), 0.75);
    } 
    
    // a grid:
    //out_color += vec4(length(exp(-80.*abs(0.5-mod(v_pos, 1.))))) * vec4(1.-exp(1.-2.*length((0.5-mod(v_pos, 1.)))));

    //out_color = vec4(v_pos.z+1.);
}