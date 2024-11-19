#version 330
precision mediump float;

#include "lib.glsl"
#include "common.glsl"

uniform sampler2D u_tex_fluid;
uniform sampler2D u_tex_physarum;
uniform sampler2D u_tex_spherical;
uniform sampler2D u_tex_normal;
uniform vec3 u_wall_u;
uniform float u_seconds;
uniform float u_lightness;
uniform float u_hue;
uniform float u_huerange;
uniform float u_saturation;
uniform float u_gamma;
uniform float u_descend;

in vec2 v_uv;
in vec3 v_normal;
in vec4 v_color;

layout(location = 0) out vec4 out0;

// "zero" value of the velocity vector
float XYo = 0.5;
float Zo = 0.5;

vec2 dim = textureSize(u_tex_fluid, 0);


void main() {
    float t = u_seconds;
    float frame = t*60.;

    vec3 normal = texture(u_tex_normal, v_uv).xyz; //normalize(v_normal);
    vec3 spherical = texture(u_tex_spherical, v_uv).xyz;
    vec3 sphnormal = -spherical;
    mat3 uv2xyz, xyz2uv;
    coordinates1(normal, spherical, u_wall_u, uv2xyz, xyz2uv);

    vec3 drift;
    vec2 duv = getDrift(u_seconds, u_descend, spherical, xyz2uv, drift);

    ivec2 dim = textureSize(u_tex_fluid, 0);
    vec2 ut = 1./dim;

    out0 = vec4(v_uv, 0, 1);
	vec4 fluid = texture(u_tex_fluid, v_uv);
    // rotate fluid.xy (flow)
    vec3 flow = uv2xyz * vec3(fluid.xy-XYo, 0);
    fluid.xy = flow.xy + XYo;

    
	vec4 physarum = texture(u_tex_physarum, v_uv);

    out0 = fluid;
    out0.zw = vec2(fluid.w);
    out0 = vec4(fluid.z) * 0.5;
    

    vec4 n = texture(u_tex_fluid, v_uv + ut*vec2( 0, 1)),
         s = texture(u_tex_fluid, v_uv + ut*vec2( 0,-1)),
         e = texture(u_tex_fluid, v_uv + ut*vec2( 1, 0)),
         w = texture(u_tex_fluid, v_uv + ut*vec2(-1, 0));

    // this could be a used as a kind of caustic, but the grain noise tends to dominate it:
    float caustic = -0.25*(e.x - w.x + n.y - s.y) * 8.;


    out0.rgb *= hsl2rgb(vec3(0.6, 0.5 + 0.5*spherical.y, 0.6+0.2*spherical.y));

    vec3 aura = hsl2rgb(vec3(0.4-0.5*fluid.w, 0.8, 0.8))*fluid.w*fluid.w*fluid.w*0.5;

    out0.rgb += aura;
    out0 += caustic;
    out0 += pow(physarum.w,1.5)*0.2;

    // more phys: 
    // debug: out0 = vec4(physarum.xy/dim, physarum.z, 1.);

    float dist = length(gl_FragCoord.xy - physarum.xy);
    float dots = exp(-0.9*dist);
   out0 += vec4(0.8, 0.01, 0.01, 0 )*dots*0.75;//(0.7, 1, 0.9, 0,) (0.3, 0.7, 0.5, 0), alien shrimp (0.8, 0.01, 0.01, 0)
    //out0 += vec4(dots);
    // out0.rgb = (1.-fluid.w) * hsl2rgb(vec3(u_hue + u_huerange*dot(flow, vec3(-1, 0, 0)), u_saturation * abs(fluid.z-0.5), u_lightness));
    // out0.rgb = pow(out0.rgb, vec3(u_gamma));
    //out0.rgb = 1.-fluid.www * hsl2rgb(vec3(0.5*sin(2.*length(fluid.xy)), abs(fluid.z-0.5), 0.85));
    //out0.rgb = 1.-fluid.www * hsl2rgb(vec3(0.5, 0.5, 0.85));
    //out0 = vec4(flow*0.5+0.5, 1);
    //out0 = fluid;

    //ut0 = vec4(duv, 0, 1);
    //out0 = vec4(spherical, 1);
    //out0 = vec4(normal, 1);
    //out0 = vec4(sphnormal, 1);

    // out0 = vec4(v_uv.x);
    // mat2 rot = rotate_mat(twopi * v_uv.x);
    // vec2 vel = rot * vec2(1, 0);
    // out0 = vec4(vel.x);
    // out0 = vec4( mod((atan(vel.y, vel.x))/twopi, 1)  );

    //out0 = vec4(pow(fluid.w, 8));
}