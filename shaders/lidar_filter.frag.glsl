#version 330
precision mediump float;

uniform sampler2D u_tex0;
uniform sampler2D u_tex1;
uniform sampler2D u_tex_input;

in vec2 v_uv;

layout(location = 0) out vec4 frag_out0;
layout(location = 1) out vec4 frag_out1;

void main() {
    frag_out0 = vec4(v_uv, 0, 1);

    vec4 prevframe = texture(u_tex0, v_uv);
    vec4 feedback = texture(u_tex1, v_uv);
    vec4 feedback_blur = texture(u_tex1, v_uv, 1.);
    vec4 input = texture(u_tex_input, v_uv);

    float threshold = 0.1;
    float human = 0;

    if (input.g > threshold) {
        frag_out1 = mix(input, feedback, 0.999);

        human = 1*abs(input - feedback).g;

    } else {
        // no input data, just continue to use blurred background:
        frag_out1 = feedback_blur;

    }


	frag_out1 = input.g > 0.2 ? mix(input, feedback, 0.9999) : feedback_blur; // + feedback;



    
	frag_out0 = vec4(human); //step(0.1, input); //abs(input - feedback); // + feedback;
    
}