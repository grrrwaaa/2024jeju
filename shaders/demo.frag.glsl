#version 330
precision mediump float;
#include "lib.hash.glsl"


uniform sampler2D u_tex_feedback;
uniform sampler2D u_tex_network;
uniform float u_frame;
uniform vec4 u_random;

in vec2 v_uv;

layout(location = 0) out vec4 out0;

void main() {
    ivec2 dim = textureSize(u_tex_feedback, 0);
    vec2 texelsize = 1./dim;
    ivec2 texel = ivec2(v_uv * dim);

    vec4 C  = texture(u_tex_feedback, v_uv);
    vec4 N  = texture(u_tex_feedback, v_uv + texelsize * vec2( 0,  1));
    vec4 S  = texture(u_tex_feedback, v_uv + texelsize * vec2( 0, -1));
    vec4 W  = texture(u_tex_feedback, v_uv + texelsize * vec2(-1,  0));
    vec4 E  = texture(u_tex_feedback, v_uv + texelsize * vec2( 1,  0));
    vec4 NE = texture(u_tex_feedback, v_uv + texelsize * vec2( 1,  1));
    vec4 SE = texture(u_tex_feedback, v_uv + texelsize * vec2( 1, -1));
    vec4 NW = texture(u_tex_feedback, v_uv + texelsize * vec2(-1,  1));
    vec4 SW = texture(u_tex_feedback, v_uv + texelsize * vec2(-1, -1));
    vec4 sum = N+S+E+W + NW+NE+SW+SE;

    vec4 a = step(0.5, C) * step(1.5, sum) * step(sum, vec4(3.5))
           + step(0.5, 1.-C) * step(2.5, sum) * step(sum, vec4(3.5))
    ;

    out0 = a;
    
    // init:
    if (mod(u_frame, 330) <= 1.) {
        out0 = step(0.85, vec4(hash12(texel + dim*u_random.xy)));
    }


}