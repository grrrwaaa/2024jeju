#version 330
precision mediump float;
#include "lib.glsl"
#include "common.glsl"

uniform vec3 u_wall_u;

in vec2 v_uv;
in vec3 v_normal;
in vec4 v_color;

layout(location = 0) out vec4 out0;
layout(location = 1) out vec4 out1;


void main() {

    vec3 normal = normalize(v_normal);
    vec3 cubical = v_color.xyz*2-1;
    vec3 spherical = normalize(cubical);
    // // normal for a spherical coordinate space:
    // vec3 sphnormal = -spherical;// -spherical; // normal, -cubical, or -spherical?
    // // get UV vectors in 3D space:
    // vec3 unit_u = normalize(u_wall_u);
    // vec3 unit_v = normalize(cross(sphnormal, unit_u));
    // // one more to get it properly spherical:
    // unit_u = normalize(cross(unit_v, sphnormal));
    // // get conversion matrices between spaces:
    // // result.xyz in in 3D space. input.z is along normal (typically 0?)
    // mat3 uv2xyz = mat3(unit_u, unit_v, sphnormal);
    // // result.xy is in UV space (result.z is along normal):
    // mat3 xyz2uv = transpose(uv2xyz);

    out0 = vec4(spherical, 1);
    out1 = vec4(normal, 1);
}