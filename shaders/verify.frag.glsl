#version 330
precision mediump float;
#include "lib.glsl"
#include "lib.hash.glsl"

uniform sampler2D u_tex_feedback;
uniform sampler2D u_tex_lidar;
uniform float u_use_lidar;
uniform float u_frame;
uniform vec4 u_random;
uniform float u_unique;

in vec2 v_uv;
in vec3 v_normal;
in vec4 v_color;

layout(location = 0) out vec4 out0;

void main() {
    vec3 normal = normalize(v_normal);
    vec3 cubical = v_color.xyz*2-1;
    vec3 spherical = normalize(cubical-0.5);
    out0 = vec4(v_uv, 0, 1);
    //out0 = vec4(normal*0.5+0.5, 1);
    // out0 = v_color;
    out0 = vec4(spherical*0.5+0.5, 1);
	//out0 = texture(u_tex_feedback, v_uv);

    
    ivec2 dim = textureSize(u_tex_feedback, 0);
    vec2 ut = 1./dim;
    ivec2 texel = ivec2(v_uv * dim);
    float iTime = u_frame / 30. + u_unique * 100.;

    // drift:
    // we want to be able to take a 3D drift direction and convert it into a 2D texture coordinate direction
    // drift is in spherical space; so we need the projection from spherical to texcoord
    // the problem is that `spherical` comes from v_color which is not a texcoord, so we can't sample it to get the gradient
    // 


    // vec3 drift = vec3(ut * 2., 0);
    // drift = rotate(drift, spherical, iTime);
    // drift = rotate(drift, spherical, iTime);
    //vec3 drift = spherical * 0.01 * sin(iTime);

    vec3 drift = rotate(vec3(1, 0, 0), spherical, iTime);
    
    vec2 dz = vec2(dFdx(drift.b), dFdy(drift.b)) * 1000.;
    //out0 = vec4(dz, 0, 1);

    //vec3 drift = dx * vec3(ut * 4., 0);

    // e.g., what would be the drift that moves toward the bluest part of spherical?
    //out0 = vec4(spherical.b);

    //vec3 drift = spherical.zxy * vec3(ut*3., 0);

    // so for example, how do you know what direction is always clockwise around Z?

    vec4 prev = texture(u_tex_feedback, v_uv + dz*ut*2.);
    //prev = median5(u_tex_feedback, v_uv + drift.xy, ut);



    //out0 = prev;

    vec4 r4 = hash42(texel + dim*u_random.xy);
    //if (mod(u_frame, 263000) <= 1.) 
    if (r4.a > 0.95) {
        out0.rgb = r4.rgb;
    }

    if (u_use_lidar > 0.) {
        vec4 lidar = texture(u_tex_lidar, v_uv);
        out0.rgb += lidar.rgb * lidar.w * 3.;
    }
    
}