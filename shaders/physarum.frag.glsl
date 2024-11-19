#version 330
precision mediump float;
#include "lib.hash.glsl"
#include "lib.glsl"
#include "hg.glsl"

uniform sampler2D u_tex_feedback;
uniform float u_seconds;
uniform vec4 u_random;
uniform float u_unique;
uniform vec3 u_wall_u;
uniform float u_descend;
uniform float u_init;

//uniform float u_deposit_rate;

in vec2 v_uv;
in vec3 v_normal;
in vec4 v_color;

float dt = 1/30.;
float u_deposit_rate = 8;
float blur_rate = 0.95;
float decay_rate = 0.97;
float sensor_angle = pi * 0.2;
// smaller makes their trails narrower
// larger (hundreds) makes them more like flocks
float sensor_distance = 350.;
float turn_angle = pi * 0.01;
float wander_angle = pi * 0.02;
float speed = 400.;
float spawn_distance = 100.;
float spawn_threshold = 0.005;
float spawn_mix = 0.;

layout(location = 0) out vec4 out0;

vec2 dim = textureSize(u_tex_feedback, 0);

// get particle at U
vec4 get(vec2 U) {
    return texture(u_tex_feedback, U/dim);
}
// what the particle senses (from inputs?)
float getfield(in vec2 U) {
    //return mix(B(U).w, C(U).g, 0.95);
    return get(U).w;
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
    float frame = t*60.;
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

    vec3 drift = vec3(8*sin(t), 5*sin(t*0.654), 4*(cos(t)-0.3)); // rotate(vec3(1, 0, 0), spherical, t);
    //drift = v_normal * 4.;
    //drift += rotate(vec3(5, 0, 0), cubical, -t) + vec3(0, 0, -3);
    drift = 0.5*vec3(3.*sin(t + 5*cubical.z), -u_descend - 3*cos(0.1*t), -4*(cos(t + 2.*cubical.x)+0.1));
    drift *= 0.4;
    vec2 duv = (xyz2uv * drift).xy;


    vec2 U = gl_FragCoord.xy;
    //U -= duv;

    vec4 input = texture(u_tex_feedback, U/dim);
    out0 = vec4(input);

    // FIND NEAREST PARTICLE
    vec4 P = get(U);
    float trail = P.w;
    // in each axis consider a couple of steps:
    // if particle.xy there is actually closer to our pixel, use that particle instead
    if (true) {
        for (int y=-2; y<=2; y++) {
            for (int x=-2; x<2; x++) {
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
    float dist = length(U - P.xy);
    // old trail value where this particle is:
    float oldtrail = get(P.xy).w;

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
        float n = get(U+vec2(0,1)).w;
        float s = get(U+vec2(0,-1)).w;
        float e = get(U+vec2(1,0)).w;
        float w = get(U+vec2(-1,0)).w;
        float avg = 0.25*(n+s+e+w);
        trail = mix(trail, avg, blur_rate);

        // decay:
        trail *= decay_rate;

        // deposit from nearest particle:
        trail += (u_deposit_rate * dt * exp(-dist*dist));
    }
    out0.w = trail;

    //if (spawn_mix)
    // spawn if particle is too far away
    if (dist > spawn_distance) { // && oldtrail > spawn_threshold) {
        P.xy = mix(P.xy, U, spawn_mix);
        P.z = rand(P.xy);
    }
    //P.xy = mix(P.xy, U, spawn_mix);

    // now we have our nearest particle
    
    // get direction matrix:
    // forced rotation
    //P.z = mod(P.z - 0.01, 1.);
    mat2 rot = rotate_mat(twopi * P.z);
    
    if (true) {
        // this could all be precomputed?
        float sd = sensor_distance;// * oldtrail*oldtrail;
        mat2 sense_rot = rotate_mat(sensor_angle);
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
                P.z = mod(P.z - turn_angle, 1.);
            } else if (f2 > f0 && f2 > f1) {
                // turn right:
                P.z = mod(P.z + turn_angle, 1.);
            } else if (f0 > f1 && f2 > f1) {
                // turn randomly
                //wander
            } else {
                // no turn
            }
                P.z = mod(P.z + wander_angle*(rand(vec3(P.xy, t))-0.5), 1.);
        } 
    }

    // move it:
    rot = rotate_mat(twopi * P.z);
    P.xy += (rot * vec2(speed*dt*oldtrail, 0.));

    out0.xyz = P.xyz;

    if (u_init > 0.5 || t < 1) out0 = init(U);
}