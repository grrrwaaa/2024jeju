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
uniform vec3 u_wall_u;

in vec2 v_uv;
in vec3 v_normal;
in vec4 v_color;
in mat3 v_xyz2uv;

layout(location = 0) out vec4 out0;

void main() {
    float t = u_frame / 60;
    vec3 normal = normalize(v_normal);
    vec3 cubical = v_color.xyz*2-1;
    vec3 spherical = normalize(cubical);
    // normal for a spherical coordinate space:
    vec3 sphnormal = normal;// -spherical; // normal, -cubical, or -spherical?
    sphnormal = -cubical;
    sphnormal = -spherical;

    // get UV vectors in 3D space:
    vec3 unit_u = normalize(u_wall_u);
    vec3 unit_v = normalize(cross(sphnormal, unit_u));
    // one more to get it properly spherical:
    unit_u = normalize(cross(unit_v, sphnormal));
    // get conversion matrices between spaces:
    // result.xyz in in 3D space. input.z is along normal (typically 0?)
    mat3 uv2xyz = mat3(unit_u, unit_v, sphnormal);
    // result.xy is in UV space (result.z is along normal):
    mat3 xyz2uv = transpose(uv2xyz);

    //out0 = vec4(v_uv, 0, 1);
    out0 = vec4(normal*0.5+0.5, 1);
    // out0 = v_color;
    // out0 = vec4(spherical*0.5+0.5, 1);
    // out0 = vec4(cubical*0.5+0.5, 1);
    // out0 = vec4(spherical, 1);
	//out0 = texture(u_tex_feedback, v_uv);

    // ok but what about spherical space?


    ivec2 dim = textureSize(u_tex_feedback, 0);
    vec2 ut = 1./dim;
    ivec2 texel = ivec2(v_uv * dim);
    float iTime = u_frame / 30. + u_unique * 100.;

    vec4 old = texture(u_tex_feedback, v_uv);
    //out0 = old;

    // drift:
    // we want to be able to take a 3D drift direction and convert it into a 2D texture coordinate direction
    // drift is in spherical space; so we need the projection from spherical to texcoord
    // the problem is that `spherical` comes from v_color which is not a texcoord, so we can't sample it to get the gradient
    // 


    // vec3 drift = vec3(ut * 2., 0);
    // drift = rotate(drift, spherical, iTime);
    // drift = rotate(drift, spherical, iTime);
    //vec3 drift = spherical * 0.01 * sin(iTime);

    vec3 drift = vec3(8*sin(t), 5*sin(t*0.654), 4*(cos(t)-0.3)); // rotate(vec3(1, 0, 0), spherical, t);
    //drift = v_normal * 4.;
    //drift += rotate(vec3(5, 0, 0), cubical, -t) + vec3(0, 0, -3);

    drift = 0.5*vec3(3.*sin(t + 5*cubical.z), -3*cos(0.1*t), -4*(cos(t + 2.*cubical.x)+0.5));

    vec2 duv = (xyz2uv * drift).xy;
    
    //vec2 dz = vec2(dFdx(drift.b), dFdy(drift.b)) * 1000.;
    //out0 = vec4(dz, 0, 1);

    //vec3 drift = dx * vec3(ut * 4., 0);

    // e.g., what would be the drift that moves toward the bluest part of spherical?
    //out0 = vec4(spherical.b);

    //vec3 drift = spherical.zxy * vec3(ut*3., 0);

    // so for example, how do you know what direction is always clockwise around Z?

    vec4 prev = texture(u_tex_feedback, v_uv - duv*ut);
    //prev = texelFetch(u_tex_feedback, ivec2(v_uv - duv*ut), 0);
    //prev = texelFetch(u_tex_feedback, ivec2(vec2(texel)-duv), 0);
    //prev = median5(u_tex_feedback, v_uv + drift.xy, ut);



    out0 = prev*0.999;

    vec4 r4 = hash42(texel + dim*u_random.xy);
    //if (mod(u_frame, 263000) <= 1.) 
    if (r4.a > 0.9995) {
        out0.rgb = r4.rgb;
        
    } else if (r4.a > 0.998) {
        //out0 = vec4((spherical*0.5+0.5)*vec3(0., 0.02, 0.3), 1);
        //out0 = vec4(v_normal*0.0+0.5, 1);
    }

    vec2 target = vec2(sin(t), cos(t/3))*0.45+0.5;
    vec2 rel = target - v_uv;
    float d = length(rel);
    float g = exp(-100.*d);

    out0.rgb = mix(out0.rgb, vec3(vec3(v_uv, 0.5)), vec3(g));


    // if (u_use_lidar > 0.) {
    //     vec4 lidar = texture(u_tex_lidar, v_uv);
    //     out0.rgb += lidar.rgb * lidar.w * 3.;
    // }
    
}