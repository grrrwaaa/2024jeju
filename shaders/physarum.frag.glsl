#version 330
precision mediump float;
#include "lib.hash.glsl"
#include "lib.glsl"
#include "hg.glsl"
#include "common.glsl"

uniform sampler2D u_tex_feedback;
uniform sampler2D u_tex_fluid;
uniform sampler2D u_tex_spherical;
uniform sampler2D u_tex_normal;
uniform float u_seconds;
uniform vec4 u_random;
uniform float u_unique;
uniform vec3 u_wall_u;
uniform float u_descend;
uniform float u_drift_amount;
uniform float u_init;
uniform float u_dt;

//uniform float u_deposit_rate;

in vec2 v_uv;
in vec3 v_normal;
in vec4 v_color;

// "origin zero" value of the velocity vector set to 0.5 so that we can represent positive and negative flows in a 0..1 range
float XYo = 0.5;
float Zo = 0.5;

/*
float dt = 1/30.;
float u_deposit_rate = 8;
float u_blur_rate = 0.95;
float u_decay_rate = 0.97;
float u_sensor_angle = pi * 0.5;
// smaller makes their trails narrower
// larger (hundreds) makes them more like flocks
float u_sensor_distance = 300.;
float u_turn_angle = pi * 0.39;
float u_wander_angle = pi * 0.01;
float speed = 400.;
float spawn_distance = 100.;
float u_spawn_threshold = 0.005;
float u_spawn_mix = 0.;

float dt = 1/30.;
float u_deposit_rate = 8;
float u_blur_rate = 0.5;
float u_decay_rate = 0.99;
float u_sensor_angle = pi * 0.2;
// smaller makes their trails narrower
// larger (hundreds) makes them more like flocks
float u_sensor_distance = 50.;
float u_turn_angle = pi * 0.01;
float u_wander_angle = pi * 0.00;
float speed = 300.;
float spawn_distance = 50.;
float u_spawn_threshold = 0.05;
float u_spawn_mix = 0.;
*/

uniform float u_caustic_spawn;
uniform float u_aura_spawn; 
uniform float u_spawn_threshold;
uniform float u_sensor_distance;
uniform float u_sensor_angle;
uniform float u_turn_angle;
uniform float u_wander_angle;
uniform float u_fluid_effect_speed;
uniform float u_drift_effect_speed;
uniform float u_trail_effect_speed;
uniform float u_deposit_rate;
uniform float u_blur_rate;
uniform float u_decay_rate;


// search radius:
#define N 4

layout(location = 0) out vec4 out0;

vec2 dim = textureSize(u_tex_feedback, 0);
vec2 ut = 1./dim;

// get particle at U
vec4 get(vec2 U) {
 //   return texture(u_tex_feedback, U/dim);
    return texelFetch(u_tex_feedback, ivec2(U), 0);
}
// what the particle senses (from inputs?)
float getfield(in vec2 U) {
    //return mix(B(U).w, C(U).g, 0.95);
    return texture(u_tex_feedback, U/dim).w;
}



vec4 init(in vec2 U) {
    // trails
    vec2 uv = U/dim - 0.5;
    //float trail = (length(uv) < 0.3 ? 0.5 : 0.);
    
    // manhattan:
    float g = 100.;
    vec2 mq = g * (floor(U/g)+0.5);
    vec2 rel = 2.*(U-mq)/g;
    //float dist = length(rel);
    float dist = max(abs(rel.x), abs(rel.y));
    float trail = smoothstep(0.9, 1., dist);

    // particles:
    float q = 30.;
    U = q*floor(U/q);
    float a = rand(U/dim);
    return vec4(U, a, trail);
    //return vec4(dim/2., a, trail);
}

void swap (inout vec4 Q, vec2 U, vec2 r) {
    // Q is our current estimated nearest particle
    // n is the particle at a pixel nearby
	vec4 n = get(U+r); 
    // if n is closer to our pixel coordinate, pick that one instead (via Q=n)
    if (length(U-n.xy) < length(U-Q.xy)) Q = n;
}

void main() {
    float t = u_seconds;
    float dt = 1./30.; //u_dt;
    float frame = t*60.;
    vec3 normal = texture(u_tex_normal, v_uv).xyz; //normalize(v_normal);
    vec3 spherical = texture(u_tex_spherical, v_uv).xyz;
    vec3 sphnormal = -spherical;
    mat3 uv2xyz, xyz2uv;
    coordinates1(normal, spherical, u_wall_u, uv2xyz, xyz2uv);

    vec3 drift;
    vec2 duv = getDrift(u_seconds, dt, u_descend, u_drift_amount, spherical, xyz2uv, drift);
    vec4 fluid = texture(u_tex_fluid, v_uv);

    vec2 dv = duv*u_drift_effect_speed + (fluid.xy - XYo)*u_fluid_effect_speed;

    bool isFloor = u_wall_u.z < 0.;


    // u_sensor_distance *= (1 + 0.8*spherical.y);
    // spawn_distance *= (1 + 0.5*spherical.y);


    vec2 U = gl_FragCoord.xy;
    vec4 rnd = hash43(vec3(U + dim*u_random.xy, frame));
    //U -= duv;

    vec4 input = texture(u_tex_feedback, (U-duv)/dim);
    out0 = vec4(input);

    // FIND NEAREST PARTICLE
    vec4 P = get(U);
    // in each axis consider a couple of steps:
    // if particle.xy there is actually closer to our pixel, use that particle instead
    if (true) {
        for (int y=-N; y<=N; y++) {
            for (int x=-N; x<N; x++) {
                vec4 n = get(U+vec2(x, y));
                if (length(U-n.xy) < length(U-P.xy)) P = n;
            }
        }
    } else {
        // cheaper but less accurate version:
        swap(P,U,vec2(1,0));
        swap(P,U,vec2(0,1));
        swap(P,U,vec2(-1,0));
        swap(P,U,vec2(0,-1));
        swap(P,U,vec2(2,2));
        swap(P,U,vec2(2,-2));
        swap(P,U,vec2(-2,2));
        swap(P,U,vec2(-2,-2));
    }
    // distance to nearest particle:
    float dist = length(P.xy - U);


    vec4 n = texture(u_tex_fluid, v_uv + ut*(vec2( 0, 1)-dv)),
         s = texture(u_tex_fluid, v_uv + ut*(vec2( 0,-1)-dv)),
         e = texture(u_tex_fluid, v_uv + ut*(vec2( 1, 0)-dv)),
         w = texture(u_tex_fluid, v_uv + ut*(vec2(-1, 0)-dv));


    n = texture(u_tex_fluid, (U-dv + vec2(0, 1))/dim);   
    s = texture(u_tex_fluid, (U-dv + vec2(0,-1))/dim);   
    e = texture(u_tex_fluid, (U-dv + vec2( 1, 0))/dim);   
    w = texture(u_tex_fluid, (U-dv + vec2(-1, 0))/dim);    
    // this could be a used as a kind of caustic, but the grain noise tends to dominate it:
    float caustic = -0.25*(e.x - w.x + n.y - s.y) * 8.;
    float aura = fluid.w*fluid.w*fluid.w;
    vec4 fluid_avg = 0.25*(n+s+e+w);


    float trail = getfield(U-dv);
    // generate new trail value for this pixel:
    { 
        // trails:
        // blur:
        /*
        float sum = 0.;
        for (float y=-1.; y<=1.; y++) {
            for (float x=-1.;x<=1.;x++) {
                sum += B(U+vec2(x,y)).w;
            }
        }
        float avg = sum/ 9.;
        */
        // float n = get(U+vec2(0,1)).w;
        // float s = get(U+vec2(0,-1)).w;
        // float e = get(U+vec2(1,0)).w;
        // float w = get(U+vec2(-1,0)).w;
        float n = getfield(U+vec2(0,1)-dv);
        float s = getfield(U+vec2(0,-1)-dv);
        float e = getfield(U+vec2(1,0)-dv);
        float w = getfield(U+vec2(-1,0)-dv);
        float avg = 0.25*(n+s+e+w);
        //
        trail = mix(trail, avg, u_blur_rate);

        // decay:
        trail *= u_decay_rate;

        // deposit from nearest particle:
        if (isFloor) {
            //trail = mix(trail, exp(-dist*dist), u_deposit_rate);
            trail += (u_deposit_rate*0.25 * exp(-dist*dist));
        } else {
            trail += (u_deposit_rate*0.75 * exp(-dist*dist));
        }
    }
    out0.w = trail;

    // old trail value where this particle is:
    float oldtrail = get(P.xy).w;
    
    float nearby = 1.;//-exp(-dist);

    if ((
        (1.-u_caustic_spawn) < caustic*rnd.y*nearby
        || (1.-u_aura_spawn) < pow(fluid.w, 5)*rnd.x *nearby)
        && oldtrail >= u_spawn_threshold
    ) { //} && oldtrail >= u_spawn_threshold) {
    
        float u_spawn_mix = 0.1;
        P.xy = mix(P.xy, U, u_spawn_mix);
        P.z = rand(P.xy);
    }

    // always some random spawning:
    if (rnd.y > 0.9999) {
        P.xy = U;
        P.z = rand(P.xy);
        P.w = rand(P.yx);
    }

    //P.xy = mix(P.xy, U, 0.00001*rnd.z*rnd.z);

    // now we have our nearest particle
    
    
    
    // get direction matrix:
    // forced rotation
    //P.z = mod(P.z - 0.01, 1.);
    mat2 rot = rotate_mat(twopi * P.z);
    
    if (true) {
        // this could all be precomputed?
        float sd = u_sensor_distance;// * oldtrail*oldtrail;
        mat2 sense_rot = rotate_mat(u_sensor_angle);
        vec2 s1 = vec2(sd, 0.);
        vec2 s2 = sense_rot * s1;
        vec2 s0 = s1 * sense_rot;

        // translate & rotate by particle into world space:
        s0 = P.xy + rot*s0;
        s1 = P.xy + rot*s1;
        s2 = P.xy + rot*s2;

        // read field at sensor:
        float f0 = getfield(s0);
        float f1 = getfield(s1);
        float f2 = getfield(s2);

        if (true) {
            // Jeff Jones version
            if (f0 > f2 && f0 > f1) {
                // turn left:
                P.z = mod(P.z - u_turn_angle, 1.);
            } else if (f2 > f0 && f2 > f1) {
                // turn right:
                P.z = mod(P.z + u_turn_angle, 1.);
            } else if (f0 > f1 && f2 > f1) {
                // turn randomly
                //wander
            } else {
                // no turn
            }
                P.z = mod(P.z + u_wander_angle*(rand(vec3(P.xy, t))-0.5), 1.);
        } 
    }

    // move it:
    rot = rotate_mat(twopi * P.z);
    vec2 vel;
    vel += (rot * vec2(u_trail_effect_speed*clamp(oldtrail, 0, 1), 0.));
    //P.xy += (rot * vec2(speed*dt*oldtrail, 0.));

    // get fluid at this particle:
    vec4 Pfluid = texture(u_tex_fluid, P.xy/dim);
    vel += (Pfluid.xy - XYo) * u_fluid_effect_speed;

    // move with drift:
    //P.xy += duv;
    //P.x += sin(U.x);

    // get spherical at this particle:
    vec3 Pspherical = texture(u_tex_spherical, P.xy/dim).xyz;
    vec3 Pnormal = texture(u_tex_normal, P.xy/dim).xyz;
    mat3 Puv2xyz, Pxyz2uv;
    coordinates1(Pnormal, -Pspherical, u_wall_u, Puv2xyz, Pxyz2uv);
    vec3 Pdrift;
    vec2 Pduv = getDrift(t, dt, u_descend, u_drift_amount, Pspherical, Pxyz2uv, drift);
    P.xy += Pduv * vec2(1, -1) * u_drift_effect_speed;

    
    P.xy += vel * dt/0.02;
    // get new z:
    P.z = mod((atan(vel.y, vel.x))/twopi, 1);
    

    out0.xyz = P.xyz;
    out0.w = clamp(out0.w, 0., 2.);

    //if (u_init > 0.5 || t < 1) out0 = init(U);
    //if (u_init > 0.5) out0 = vec4(0);
}