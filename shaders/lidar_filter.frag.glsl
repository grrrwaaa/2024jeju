#version 330
precision mediump float;

#include "lib.glsl"

// the greyscale depth image from the TOF lidar:
uniform sampler2D u_tex_input;

// .xy is a bit like a velocity or normal
// .z is the intensity of existence (height map, approximately)
// .w is the long-term averaged background to subtract
uniform sampler2D u_tex0;

// texture resolution
uniform vec2 u_resolution;

in vec2 v_uv;

layout(location = 0) out vec4 out0;

// how bright a pixel has to be for us to consider it (to eliminate invalid pixels)
float exist_threshold = 0.05;
// how quickly the background subtraction fades
float background_adapt_rate = 0.005;
// brightness control of the output intensity image:
float intensity_gamma = 1.4;
float intensity_gain = 4.5;
float intensity_minimum = 0.02;
// offset to the velocity, e.g. use 0.5 to make it centred in visible range
// not strictly necessary to add an offset, because this is a float texture output
float velocity_offset = 0.;

void main() {
    out0 = vec4(v_uv, 0, 1);
    // one texel size
	vec3 ut = vec3(1./u_resolution, 0.);

    vec4 feedback0 = texture(u_tex0, v_uv);
    vec4 input = texture(u_tex_input, v_uv);
    vec4 input_median = median5(u_tex_input, v_uv, ut.xy);

    out0 = feedback0;

    float input_exist = step(exist_threshold, input.z);
    float input_median_exist = step(exist_threshold, input_median.z);
    float feedback0_exist = step(exist_threshold, feedback0.z);

    float background = feedback0.w;
    float background_exist = step(exist_threshold, background);
    // if background doesn't exist yet, use the input as background
    // which one is better?
    background = mix(input.z * input_exist, background, background_exist);
    //background = mix(input_median.z * input_median_exist, background, background_exist);
    // blend history toward input (but only if input exists)
    // which one is better?
    background = mix(background, input.z, input_exist * background_adapt_rate);
    //background = mix(background, input_median.z, input_median_exist * background_adapt_rate);

    // our input minus the previous frame's accumulated average history
    float background_previous = feedback0.w;
    float intensity = max(0., (input_median.z - background_previous) - intensity_minimum);
    // only allow change if the input exists:
    intensity *= input_median_exist;

    // gamma-scale that:
    //out0 = pow(out0 * out_gain, vec4(intensity_gamma));
    intensity = pow(intensity * intensity_gain, intensity_gamma);

    // estimate a velocity/normal value from neighbor differences:
    vec4 E = median5(u_tex0, v_uv + ut.xy * vec2( 1, 0), ut.xy);
    vec4 W = median5(u_tex0, v_uv + ut.xy * vec2(-1, 0), ut.xy);
    vec4 N = median5(u_tex0, v_uv + ut.xy * vec2(0,  1), ut.xy);
    vec4 S = median5(u_tex0, v_uv + ut.xy * vec2(0, -1), ut.xy);

    float dx = (W.z - E.z);
    float dy = (S.z - N.z);

    out0.x = dx + velocity_offset;
    out0.y = dy + velocity_offset;
    //out0.xyz = vec3(intensity);
    out0.z = intensity;
    out0.w = background;
    
}