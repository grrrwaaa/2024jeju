#version 330
precision mediump float;

#include "lib.glsl"

uniform sampler2D u_tex0;
uniform sampler2D u_tex1;
uniform sampler2D u_tex_input;
// fbo resolution
uniform vec2 u_resolution;
uniform float u_init;
uniform float u_frame;

in vec2 v_uv;

layout(location = 0) out vec4 frag_out0;
layout(location = 1) out vec4 frag_out1;

void sort2(inout vec4 a0, inout vec4 a1) {
	vec4 b0 = min(a0, a1);
	vec4 b1 = max(a0, a1);
	a0 = b0;
	a1 = b1;
}

void sort(inout vec4 a0, inout vec4 a1, inout vec4 a2, inout vec4 a3, inout vec4 a4) {
	sort2(a0, a1);
	sort2(a3, a4);
	sort2(a0, a2);
	sort2(a1, a2);
	sort2(a0, a3);
	sort2(a2, a3);
	sort2(a1, a4);
	sort2(a1, a2);
	sort2(a3, a4);
}

vec4 median(sampler2D tex, vec2 uv, vec2 ut) {
    vec4 c0 = texture(tex, uv + ut*vec2(-2,0) );
    vec4 c1 = texture(tex, uv + ut*vec2(-1,0) );
    vec4 c2 = texture(tex, uv );
    vec4 c3 = texture(tex, uv + ut*vec2(-1,0) );
    vec4 c4 = texture(tex, uv + ut*vec2(-2,0) );
    
    vec4 c5 = texture(tex, uv + ut*vec2(0,-2) );
    vec4 c6 = texture(tex, uv + ut*vec2(0,-1) );
    vec4 c7 = texture(tex, uv + ut*vec2(0,1) );
    vec4 c8 = texture(tex, uv + ut*vec2(0,2) );
    
    sort(c0, c1, c2, c3, c4);
    sort(c5, c6, c2, c7, c8);
    
    return c2;
}

void main() {
    frag_out0 = vec4(v_uv, 0, 1);

    // one texel size
	vec3 ut = vec3(1./u_resolution, 0.);

    vec4 prevframe = texture(u_tex0, v_uv);
    vec4 feedback = texture(u_tex1, v_uv);
    vec4 input = texture(u_tex_input, v_uv);
    vec4 input_median = median5(u_tex_input, v_uv, ut.xy);
    
	vec4 feedback0 = texture(u_tex0, v_uv);
	vec4 feedback1 = texture(u_tex1, v_uv);

    float blur = 2.;
	vec4 feedback0_blur = texture(u_tex0, v_uv, blur);
	vec4 feedback1_blur = texture(u_tex1, v_uv, blur);
    vec4 input_blur = texture(u_tex_input, v_uv, blur);

	// sample our 4 nearest pixels:
	float blur1 = blur;
	vec4 feedback1_blurN = texture(u_tex1, v_uv + ut.zy, blur1);
	vec4 feedback1_blurS = texture(u_tex1, v_uv - ut.zy, blur1);
	vec4 feedback1_blurE = texture(u_tex1, v_uv + ut.xz, blur1);
	vec4 feedback1_blurW = texture(u_tex1, v_uv - ut.xz, blur1);

    // get the smallest of the 4 neighbors:
	vec4 feedback1_blurmin = min(min(feedback1_blurN, feedback1_blurS), min(feedback1_blurE, feedback1_blurW));
	vec4 feedback1_blurmax = max(max(feedback1_blurN, feedback1_blurS), max(feedback1_blurE, feedback1_blurW));
	// vertical
	float feedback1_blurV = feedback1_blurN.b - feedback1_blurS.b;
	float feedback1_blurH = feedback1_blurE.b - feedback1_blurW.b;
    float contour_angle = wrap( -atan(feedback1_blurH, feedback1_blurV)/twopi + 0.25, 1.);

    // zero means no data
    float threshold = 0.1;
    float inexist = step(threshold, input.g);
	float fbexist1 = step(threshold, feedback1.g);
    // you have to exist for 2 frames for us to pay attention:
	float fbexist2 = inexist * fbexist1;

    // float fbdepth = feedback1.g;
    // float human = 0;
    // if (input.g > threshold) {
    //     frag_out1 = mix(input, feedback, 0.999);
    //     human = 1*abs(input - feedback).g;
    // } else {
    //     // no input data, just continue to use blurred background:
    //     frag_out1 = feedback_blur;
    // }
	//frag_out1 = input.g > 0.2 ? mix(input, feedback, 0.9999) : feedback_blur; // + feedback;

    frag_out1 = feedback1;

    if (inexist > fbexist1) {
        // if we have new data input but the previous fb did not exist, then just write directly in
        frag_out1 = input;
    } else if (inexist * fbexist1 > 0.) {
        // if both input & feedback exist, blend slightly to update background image
        frag_out1 = mix(frag_out1, feedback1_blur, 0.0001);
        frag_out1 = mix(frag_out1, input, 0.00001);
        frag_out1 = mix(frag_out1, input_blur, 0.001);
    }
    
	frag_out0 = inexist > 0. ? vec4(abs(input - feedback1_blur)) : feedback0; //step(0.1, input); //abs(input - feedback); // + feedback;


    frag_out0 = abs(input - feedback0.a);

    // store the last input into our feedback0.a channel:
    frag_out0.a = input.g;

    frag_out0 = input_median;
    
    if (u_init > 0.) {
        frag_out0 = vec4(0);
        frag_out1 = vec4(0);
    }
}