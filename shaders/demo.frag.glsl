#version 330
precision mediump float;
#include "lib.hash.glsl"


uniform sampler2D u_tex_feedback;
uniform sampler2D u_tex_lidar;
uniform float u_use_lidar;
uniform float u_frame;
uniform vec4 u_random;
uniform float u_unique;

in vec2 v_uv;

layout(location = 0) out vec4 out0;



ivec2 dim = textureSize(u_tex_feedback, 0);
vec2 texelsize = 1./dim;

#define A(pos) texture(u_tex_feedback, pos/dim.xy)

// back project along the vector field to guess where we were previously:
vec4 prev(vec2 coord) {
    coord -= (A(coord).xy-0.5)*0.5;
    coord -= (A(coord).xy-0.5)*0.5;
    return A(coord);
}

#define norm(v) ((v)/(length(v)+1e-10))

// distance of pt to 2D line segment from start to end
float line2(vec2 pt, vec2 start, vec2 end) {
    vec2 g = end-start, h = pt-start;
    return length(h - g*clamp(dot(g,h)/dot(g,g), 0.0, 1.));
}


void main() {
    ivec2 texel = ivec2(v_uv * dim);

    vec4 OUT = vec4(0);
    float iTime = u_frame / 30. + u_unique * 100.;
    vec2 DIM = dim;
    vec2 COORD = v_uv * (dim);


    // past neighborhood states (per flow)
    vec4 p = prev(COORD),
         n = prev(COORD + vec2( 0, 1)),
         s = prev(COORD + vec2( 0,-1)),
         e = prev(COORD + vec2( 1, 0)),
         w = prev(COORD + vec2(-1, 0));
    // diffused past:
    vec4 avg = (n+s+e+w)*0.25;
    // ordered difference in the pressure/convergence/disorder (A.z) 
    // creates velocity in me (OUT.xy)
    vec2 force = -0.25*vec2(e.z-w.z, n.z-s.z);

    force *= 1.;// + 0.5*sin(u_frame * 0.1);
    // new velocity derived from neighbourhood average
    // should this be p.xy rather than avg.xy?
    // either the velocity or the pressure should be diffused, but not both
    float blend = sin(iTime)*0.5+0.5;  // I like blend=0 more, it gives more turbulence; 1 is more smoky
    //OUT.xy = avg.xy + force;
    OUT.xy = 0.5 + mix(p.xy-0.5, avg.xy-0.5, blend) + force; 
    
    // variance in the velocity (A.xy) near me creates pressure/convergence/disorder in me
    float press = -0.25*(e.x + n.y - w.x - s.y);
    // should this be avg.z rather than p.z  ?
    //OUT.z = p.z + press;
    OUT.z = mix(avg.z, p.z, blend) + press;
    
    /*
        This whole thing about bouncing energy between the velocity and pressure reminds me of scatter junctions in physical models!
    */
    
    // mass transport
    float transport = -0.25*((e.x-0.5)*e.w - (w.x-0.5)*w.w + (n.y-0.5)*n.w - (s.y-0.5)*s.w);
    // can mix between p.w and avg.w here to allow general diffusion of mass
    // slightly unrealistic in that this can result in negative mass
    OUT.w = mix(p.w, avg.w, 0.9) + transport;

    
    // optional decays
    // xy or z, don't need to do both
    // OUT.xy *= 0.99;
    //OUT.z = clamp(OUT.z*0.99999, -1., 1.);
    //OUT.w = clamp(OUT.w*0.99999, 0., 1.);

    
    // optional add forces
    float d = line2(COORD, DIM/2. - DIM.y*0.2* vec2(sin(iTime*0.42),cos(iTime*0.32)), DIM/2. + DIM.y*0.6* vec2(sin(iTime*.1618),cos(iTime*.18)));
    //if (d < 1.) 
    {
        //OUT += exp(-d*0.5) * vec4(cos(iTime*0.26), sin(iTime*0.45), 0, 1.);
    }

    vec4 rnd = hash43(vec3(texel + dim*u_random.xy, u_frame));

    if (u_use_lidar > 0.) {
        vec4 lidar = texture(u_tex_lidar, v_uv);
        OUT.xy += lidar.xy * lidar.z;
        OUT.z += lidar.z; // * lidar.w;

        OUT.w += lidar.z * lidar.w * rnd.w;
    }
    // if (iMouse.z > 0. && length(iMouse.xy - COORD) < 4.) {
    //     OUT = vec4(COORD/DIM - 0.5, 0., 1.);
    // }
    
   // OUT.xy += 0.001 * (hash23(vec3(texel + dim*u_random.xy, u_frame))-0.5);
    
    // boundary:
    // float b = 4.;
    // if (COORD.x < b || COORD.y < b || DIM.x-COORD.x < b || DIM.y-COORD.y < b) {
    //     OUT = vec4(0);
    // }

    
    OUT.z = clamp(OUT.z, -1., 1.);
    OUT.w = clamp(OUT.w, 0., 1.);

    out0 = OUT;

    // vec4 C  = texture(u_tex_feedback, v_uv);
    // vec4 N  = texture(u_tex_feedback, v_uv + texelsize * vec2( 0,  1));
    // vec4 S  = texture(u_tex_feedback, v_uv + texelsize * vec2( 0, -1));
    // vec4 W  = texture(u_tex_feedback, v_uv + texelsize * vec2(-1,  0));
    // vec4 E  = texture(u_tex_feedback, v_uv + texelsize * vec2( 1,  0));
    // vec4 NE = texture(u_tex_feedback, v_uv + texelsize * vec2( 1,  1));
    // vec4 SE = texture(u_tex_feedback, v_uv + texelsize * vec2( 1, -1));
    // vec4 NW = texture(u_tex_feedback, v_uv + texelsize * vec2(-1,  1));
    // vec4 SW = texture(u_tex_feedback, v_uv + texelsize * vec2(-1, -1));
    // vec4 sum = N+S+E+W + NW+NE+SW+SE;

    // vec4 a = step(0.5, C) * step(1.5, sum) * step(sum, vec4(3.5))
    //        + step(0.5, 1.-C) * step(2.5, sum) * step(sum, vec4(3.5))
    // ;

    // out0 = a;
    
    // init:
    if (mod(u_frame, 263000) <= 1.) {
        out0 = mix(vec4(0.5, 0.5, 0.1, 0.1), hash42(texel + dim*u_random.xy), 0.1);
    }


}