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
uniform float u_saturation;
uniform float u_gamma;
uniform float u_ink_mode;
uniform float u_descend;
uniform float u_drift_amount;
uniform float u_final_pressure;
uniform float u_final_aura;
uniform float u_final_trails;
uniform float u_final_creatures;
uniform vec3 final_gamma;
uniform vec3 u_ocean_hsl;
uniform vec3 u_ocean_hsl_variation;
uniform vec3 u_aura_hsl;
uniform vec3 u_aura_hsl_variation;
uniform vec3 u_creatures_rgb;
uniform vec3 u_creatures_rgb1;
uniform vec3 u_creatures_hsl;
uniform vec3 u_creatures_hsl_inside;
uniform float u_dt;

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
    vec2 duv = getDrift(u_seconds, u_dt, u_descend, u_drift_amount, spherical, xyz2uv, drift);

    ivec2 dim = textureSize(u_tex_fluid, 0);
    vec2 ut = 1./dim;

    out0 = vec4(v_uv, 0, 1);
	vec4 fluid = texture(u_tex_fluid, v_uv);
    // rotate fluid.xy (flow)
    vec3 flow = uv2xyz * vec3(fluid.xy-XYo, 0);
    fluid.xy = flow.xy + XYo;
    
    vec4 n = texture(u_tex_fluid, v_uv + ut*vec2( 0, 1)),
         s = texture(u_tex_fluid, v_uv + ut*vec2( 0,-1)),
         e = texture(u_tex_fluid, v_uv + ut*vec2( 1, 0)),
         w = texture(u_tex_fluid, v_uv + ut*vec2(-1, 0));

    // this could be a used as a kind of caustic, but the grain noise tends to dominate it:
    float caustic = -0.25*(e.x - w.x + n.y - s.y) * 10.;

    float matter = fluid.w*fluid.w*fluid.w;
    float ink = pow(1.-fluid.w, 2.);


	vec4 physarum = texture(u_tex_physarum, v_uv);

    // out0 = fluid;
    // out0.zw = vec2(fluid.w);

    // basic luminance paint using fluid pressure:
    out0 = vec4(fluid.z) * u_final_pressure;
    
    // color tone by vertical:
    out0.rgb *= hsl2rgb(u_ocean_hsl + spherical.y*u_ocean_hsl_variation);

    vec3 aura = hsl2rgb(u_aura_hsl + fluid.w*u_aura_hsl_variation)*matter*u_final_aura;
    out0.rgb += aura;


    out0 += caustic;
    // more phys: 
    // debug: out0 = vec4(physarum.xy/dim, physarum.z, 1.);



    float dots = exp(-0.9*length(gl_FragCoord.xy - physarum.xy));
    vec3 creature_color = hsl2rgb(mix(u_creatures_hsl, u_creatures_hsl_inside, pow(physarum.w, 2.)));
    out0.rgb += creature_color*dots*u_final_creatures;//(0.7, 1, 0.9, 0,) (0.3, 0.7, 0.5, 0), alien shrimp (0.8, 0.01, 0.01, 0)

    vec3 oldstyle = ink*hsl2rgb(vec3(0.3+0.4*dot(fluid.xy, vec2(1,0)), 0.8*abs(fluid.z), 0.95));
    out0.rgb = mix(out0.rgb, oldstyle, u_ink_mode);
    //vec3(0.8+(fluid.xyz)*0.2);//mix(out0*vec4(1.-fluid.w), out0+vec4(1.-fluid.w), 0.5);

//    out0 += pow(physarum.w,1.5)*u_final_trails;
    

    // final pass:
//    out0.rgb = adjustSaturation(out0.rgb, u_saturation*1.5);
//   out0.rgb = pow(out0.rgb, vec3(u_gamma * 0.7));

    //out0.rgb = vec4(fluid.z) * u_final_pressure;
    //out0.rgb = vec3(1);

    //adjustSaturation(out0.rgb, sin(t));

    if (true) {

        //out0.rgb = pow(out0.rgb, vec3(0.5));

        //out0.rgb = adjustSaturation(out0.rgb, 2);


        //out0 = fluid;
        //out0 = physarum.wwww;
        //out0.rgb = vec3(mod(v_uv.y * 10., 1.) );

        out0.rgb = vec3(0);
        out0.rgb = vec3(dots);
        
        float caustic = ((e.x - w.x + n.y - s.y) * -5.);
        //if (mod(t, 3) < 1.5) caustic = abs(caustic);
        //caustic = max(caustic, 0.);
        caustic = pow(caustic, 0.5);
        out0.rgb = vec3(caustic);

        //out0.rgb = vec3(fluid.z) * u_final_pressure * 2.;

        //out0.rgb = oldstyle;

        //out0.rgb = vec3(physarum.w);


        out0 = vec4(fluid.z) * u_final_pressure;
        // color tone by vertical:
        out0.rgb *= hsl2rgb(u_ocean_hsl + (spherical.y*0.1 + 0.5)*u_ocean_hsl_variation);
        out0.rgb = pow(out0.rgb, vec3(0.75));
        out0.rgb = adjustSaturation(out0.rgb, 1.0 + spherical.y);

      

        vec3 aura_hsl = u_aura_hsl; //vec3(0.4, 0.8, 0.8);
        vec3 aura_hsl_variation = u_aura_hsl_variation; //vec3(-0.5, 0., 0.);
        vec3 aura = hsl2rgb(aura_hsl + fluid.w*aura_hsl_variation)*matter*u_final_aura;
        // remove aura in floor:
        //aura *= max(spherical.y, 0.);
        aura = adjustSaturation(aura, spherical.y-0.25);
        out0.rgb = mix(out0.rgb + aura, max(out0.rgb, aura), -spherical.y-0.5);

        //out0.rgb = vec3(-spherical.y);

        // turn this up to get the dark immersive noisy caustic world:
        out0.rgb = mix(max(out0.rgb, vec3(caustic)), out0.rgb + caustic, 0.);

        vec3 oldstyle = ink*hsl2rgb(vec3(0.3+0.4*dot(fluid.xy, vec2(1,0)), 0.8*abs(fluid.z), 0.95));
        out0.rgb = mix(out0.rgb, oldstyle, u_ink_mode);

        //out0 += pow(physarum.w,1.5)*u_final_trails;
        out0.rgb += vec3(pow(physarum.w, 1.5))*u_final_trails*1.5;

        //out0 = vec4(0);

        float dots = exp(-4.*length(gl_FragCoord.xy - physarum.xy)) * 80.;
        vec3 creature_color = hsl2rgb(0.1*vec3(0, duv) + mix(u_creatures_hsl, u_creatures_hsl_inside, pow(clamp(physarum.w*0.5, 0., 1.), 2.)));
        out0.rgb += creature_color*dots*u_final_creatures;//(0.7, 1, 0.9, 0,) (0.3, 0.7, 0.5, 0), alien shrimp (0.8, 0.01, 0.01, 0)

    }

    //out0.rgb = vec3(sin(10.*atan(spherical.x, spherical.z)));

    // out0.rgb = vec3(sin(t)*0.45+0.55);
    // out0.rgb = pow(out0.rgb, final_gamma);

    out0.a = 1.0;
}