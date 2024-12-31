#version 330
precision mediump float;
#include "lib.hash.glsl"
#include "lib.glsl"
#include "hg.glsl"
#include "common.glsl"

uniform sampler2D u_tex_feedback;
uniform sampler2D u_tex_lidar;
uniform sampler2D u_tex_spherical;
uniform sampler2D u_tex_normal;
uniform float u_use_lidar;
uniform float u_seconds;
uniform vec4 u_random;
uniform float u_unique;
uniform vec3 u_wall_u;
uniform float u_descend;
uniform float u_drift_amount;
uniform float u_init;

uniform float u_grain;
uniform float u_fluid_mode;
uniform float u_fluid_pressure_decay;
uniform float u_fluid_matter_decay;
uniform float u_fluid_velocity_decay;
uniform float u_dt;

in vec2 v_uv;
in vec3 v_normal;
in vec4 v_color;

layout(location = 0) out vec4 out0;

// "origin zero" value of the velocity vector set to 0.5 so that we can represent positive and negative flows in a 0..1 range
float XYo = 0.5;
float Zo = 0.5;

ivec2 dim = textureSize(u_tex_feedback, 0);
vec2 texelsize = 1./dim;

#define A(pos) texture(u_tex_feedback, pos/dim.xy)

// back project along the vector field to guess where we were previously:
vec4 prev(vec2 coord) {
    coord -= (A(coord).xy - XYo)*0.5;
    coord -= (A(coord).xy - XYo)*0.5;
    return A(coord);
}

#define norm(v) ((v)/(length(v)+1e-10))

float sdVerticalCapsule( vec3 p, float h, float r )
{
  p.y -= clamp( p.y, 0.0, h );
  return length( p ) - r;
}

// distance of pt to 2D line segment from start to end
float line2(vec2 pt, vec2 start, vec2 end) {
    vec2 g = end-start, h = pt-start;
    return length(h - g*clamp(dot(g,h)/dot(g,g), 0.0, 1.));
}

// Function to calculate the distance from a point to a bezier curve
float distanceToBezier(vec2 p, vec2 p0, vec2 p1, vec2 p2) {
    // Approximate the bezier curve using iterative sampling
    float minDist = 1e6;  // Start with a very large distance
    const int steps = 500;  // Number of steps for approximation

    for (int i = 0; i <= steps; i++) {
        float t = float(i) / float(steps);  // Calculate the interpolation parameter
        // Quadratic Bezier interpolation
        vec2 bezierPoint = mix(mix(p0, p1, t), mix(p1, p2, t), t);
        float dist = length(p - bezierPoint);  // Calculate the distance
        minDist = min(minDist, dist);  // Keep the smallest distance
    }
    return minDist;
}

float dot2( vec2 v ) { return dot(v,v); }
float cro( vec2 a, vec2 b ) { return a.x*b.y-a.y*b.x; }
float cos_acos_3( float x ) { x=sqrt(0.5+0.5*x); return x*(x*(x*(x*-0.008972+0.039071)-0.107074)+0.576975)+0.5; } // https://www.shadertoy.com/view/WltSD7

float sdBezier1( vec2 p, vec2 v0, vec2 v1, vec2 v2, out vec2 outQ ) {
	vec2 i = v0 - v2;
    vec2 j = v2 - v1;
    vec2 k = v1 - v0;
    vec2 w = j-k;

	v0-= p; v1-= p; v2-= p;
    
	float x = cro(v0, v2);
    float y = cro(v1, v0);
    float z = cro(v2, v1);

	vec2 s = 2.0*(y*j+z*k)-x*i;

    float r =  (y*z-x*x*0.25)/dot2(s);
    float t = clamp( (0.5*x+y+r*dot(s,w))/(x+y+z),0.0,1.0);
    
    vec2 d = v0+t*(k+k+t*w);
    outQ = d + p;
	return length(d);
}

float sdBezier( in vec2 pos, in vec2 A, in vec2 B, in vec2 C, out vec2 outQ )
{    
    vec2 a = B - A;
    vec2 b = A - 2.0*B + C;
    vec2 c = a * 2.0;
    vec2 d = A - pos;

    // cubic to be solved (kx*=3 and ky*=3)
    float kk = 1.0/dot(b,b);
    float kx = kk * dot(a,b);
    float ky = kk * (2.0*dot(a,a)+dot(d,b))/3.0;
    float kz = kk * dot(d,a);      

    float res = 0.0;
    float sgn = 0.0;

    float p  = ky - kx*kx;
    float q  = kx*(2.0*kx*kx - 3.0*ky) + kz;
    float p3 = p*p*p;
    float q2 = q*q;
    float h  = q2 + 4.0*p3;


    if( h>=0.0 ) 
    {   // 1 root
        h = sqrt(h);
        vec2 x = (vec2(h,-h)-q)/2.0;

        #if 0
        // When p≈0 and p<0, h-q has catastrophic cancelation. So, we do
        // h=√(q²+4p³)=q·√(1+4p³/q²)=q·√(1+w) instead. Now we approximate
        // √ by a linear Taylor expansion into h≈q(1+½w) so that the q's
        // cancel each other in h-q. Expanding and simplifying further we
        // get x=vec2(p³/q,-p³/q-q). And using a second degree Taylor
        // expansion instead: x=vec2(k,-k-q) with k=(1-p³/q²)·p³/q
        if( abs(p)<0.001 )
        {
            float k = p3/q;              // linear approx
          //float k = (1.0-p3/q2)*p3/q;  // quadratic approx 
            x = vec2(k,-k-q);  
        }
        #endif

        vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
        float t = uv.x + uv.y;

		// from NinjaKoala - single newton iteration to account for cancellation
        t -= (t*(t*t+3.0*p)+q)/(3.0*t*t+3.0*p);
        
        t = clamp( t-kx, 0.0, 1.0 );
        vec2  w = d+(c+b*t)*t;
        outQ = w + pos;
        res = dot2(w);
    	sgn = cro(c+2.0*b*t,w);
    }
    else 
    {   // 3 roots
        float z = sqrt(-p);
        #if 0
        float v = acos(q/(p*z*2.0))/3.0;
        float m = cos(v);
        float n = sin(v);
        #else
        float m = cos_acos_3( q/(p*z*2.0) );
        float n = sqrt(1.0-m*m);
        #endif
        n *= sqrt(3.0);
        vec3  t = clamp( vec3(m+m,-n-m,n-m)*z-kx, 0.0, 1.0 );
        vec2  qx=d+(c+b*t.x)*t.x; float dx=dot2(qx), sx=cro(a+b*t.x,qx);
        vec2  qy=d+(c+b*t.y)*t.y; float dy=dot2(qy), sy=cro(a+b*t.y,qy);
        if( dx<dy ) {res=dx;sgn=sx;outQ=qx+pos;} else {res=dy;sgn=sy;outQ=qy+pos;}
    }
    
    return sqrt( res )*sign(sgn);
}

float sdRoundBox( vec3 p, vec3 b, float r )
{
  vec3 q = abs(p) - b + r;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

void main() {
    float t = u_seconds;
    float dt = 1./45.; //u_dt;
    float frame = t*60.;

    vec3 normal = texture(u_tex_normal, v_uv).xyz; //normalize(v_normal);
    vec3 spherical = texture(u_tex_spherical, v_uv).xyz;
    vec3 sphnormal = -spherical;
    mat3 uv2xyz, xyz2uv;
    coordinates1(normal, spherical, u_wall_u, uv2xyz, xyz2uv);
    vec3 drift;
    vec2 duv = getDrift(u_seconds, dt, u_descend, u_drift_amount, spherical, xyz2uv, drift);


    vec4 OUT = vec4(0);
    float iTime = u_seconds;
    vec2 DIM = dim;
    vec2 COORD = gl_FragCoord.xy;
    COORD -= duv;
    ivec2 texel = ivec2(COORD);



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
    vec2 force = -0.25*vec2(e.z-w.z, n.z-s.z); // don't need to balance Zo here

    force *= 1.;// + 0.5*sin(u_frame * 0.1);
    // new velocity derived from neighbourhood average
    // should this be p.xy rather than avg.xy?
    // either the velocity or the pressure should be diffused, but not both
    float blend = u_fluid_mode; //sin(iTime)*0.5+0.5;  // I like blend=0 more, it gives more turbulence; 1 is more smoky
    //OUT.xy = avg.xy + force;
    OUT.xy = mix(p.xy, avg.xy, blend) + force; 
    
    // variance in the velocity (A.xy) near me creates pressure/convergence/disorder in me
    float press = -0.25*(e.x - w.x + n.y - s.y);
    // should this be avg.z rather than p.z  ?
    //OUT.z = p.z + press;
    OUT.z = mix(avg.z, p.z, blend) + press;
    
    /*
        This whole thing about bouncing energy between the velocity and pressure reminds me of scatter junctions in physical models!
    */
    
    // mass transport
    float transport = -0.25*((e.x-XYo)*e.w - (w.x-XYo)*w.w + (n.y-XYo)*n.w - (s.y-XYo)*s.w);
    // can mix between p.w and avg.w here to allow general diffusion of mass
    // slightly unrealistic in that this can result in negative mass
    OUT.w = mix(p.w, avg.w, 0.9) + transport;

    
    // optional decays
    // xy or z, don't need to do both
    // OUT.xy = (OUT.xy - XYo)*0.99 + XYo;
    OUT.z = Zo + (OUT.z-Zo)*u_fluid_pressure_decay;
    OUT.w = OUT.w*u_fluid_matter_decay;
    OUT.xy = XYo + (OUT.xy - XYo)*u_fluid_velocity_decay;
    OUT.xy += duv*0.001;
    
    // // optional add forces
    // float d = line2(COORD, DIM/2. - DIM.y*0.2* vec2(sin(iTime*0.42),cos(iTime*0.32)), DIM/2. + DIM.y*0.6* vec2(sin(iTime*.1618),cos(iTime*.18)));
    // if (u_use_lidar < 0.5 && d < 1.) 
    // {
    //     OUT += exp(-d*0.5) * vec4(cos(iTime*0.26), sin(iTime*0.45), 0, 1.);
    // }

    vec2 p0 = vec2(sin(t/3), cos(t/2))*0.5+0.5; //
    //p0 = (xyz2uv * (vec3(sin(t/3), cos(t/2), sin(t/9)))).xy;
    vec2 p1 = vec2(sin(t/8), cos(t/7))*0.5+0.5; //
    //p1 = (xyz2uv * (vec3(sin(t/8), cos(t/7), sin(t/3)))).xy;
    vec2 p2 =  vec2(cos(t/7), sin(t/6))*0.5+0.5;//
    //p2 = (xyz2uv * (vec3(cos(t/7), sin(t/6), sin(t/4)))).xy;
    vec2 kk;
    float d = 100.*(sdBezier(v_uv, p0, p1, p2, kk));

    //d = 100*length(vec2(sin(t), cos(t))*0.5+0.5 - v_uv);

    vec3 pz = rotateY(vec3(1, 0, 0), t);
    vec2 pz2 = (xyz2uv * rotateY(vec3(1, 0, 0), t)).xy;

    // all points on sphere:
    vec3 pt0 = normalize(vec3(sin(t/3), cos(t/2), sin(t/9)-0.5));
    vec3 pt1 = normalize(vec3(sin(t/8), cos(t/7), sin(t/3)));
    vec3 pt2 = normalize(vec3(cos(t/7), sin(t/6), sin(t/4)));

    p0 = (xyz2uv*(pt0-spherical)).xy;
    p1 = (xyz2uv*(pt1-spherical)).xy;
    p2 = (xyz2uv*(pt2-spherical)).xy;

    
    d = 10*length((xyz2uv*(pt0-spherical)));

    vec3 p10 = pt0 - spherical;
    pMod3(p10, vec3(2));

    d = 10*sdVerticalCapsule(p10, 0.5, 0.08);

    //d = min(d, )

    //OUT += exp(-abs(d)*100.) * vec4(cos(iTime*0.26), sin(iTime*0.45), 0, 1.);

    //d = sdRoundBox( rotateY(spherical, t), vec3(1, 1, 1), 0.1 );

    vec4 rnd = hash43(vec3(texel + dim*u_random.xy, frame));

    if (u_use_lidar > 0.) {
        vec4 lidar = texture(u_tex_lidar, v_uv);
        OUT.xy += lidar.xy * cos(lidar.z * 6.2 + iTime);
        OUT.xy = mix(OUT.xy, XYo + 10.*lidar.xy * cos(lidar.z * 6.2 + iTime), pow(lidar.w, 2.));
        OUT.z += lidar.z * 4.; // * lidar.w;
        OUT.w += lidar.z * lidar.w * rnd.w * 4.;
    }
    
    // add some noise
    OUT.xy += u_grain * (hash23(vec3(texel + dim*u_random.xy, frame))-0.5);

    
    OUT.z = clamp(OUT.z, 0., 1.);
    OUT.w = clamp(OUT.w, 0., 1.);

    
    vec3 target = normalize(vec3(-sin(t/11), cos(t/13)*0.4, sin(t/7)+0.25));
    vec3 dirxyz = target - sphnormal;
    vec2 diruv = (xyz2uv * dirxyz).xy;
    float g = exp(-250.*abs(length(dirxyz)-0.1*sin(t)));
    //OUT = vec4(XYo + diruv * exp(-30.*abs(length(dirxyz)-0.2)), Zo, 1);
    OUT.xy += g*diruv*(cos(iTime)+0.25);
    OUT.w += 0.1*g;

    out0 = OUT;
    //out0 = vec4(exp(-abs(d)));
    //out0 = vec4(exp(-100*length((xyz2uv*normalize(pz-spherical)).xy)), 0, 0, 1);

    //out0 = vec4(exp(-100.*abs(d)));

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
    // if (mod(u_frame, 263000) <= 1.) {
    //     out0 = mix(vec4(XYo, XYo, Zo, 0.1), hash42(texel + dim*u_random.xy), 0.1);
    // }

    //out0 = A(COORD); //texture(u_tex_feedback, gl_FragCoord.xy / dim.xy);

    //out0.xy += 0.1 * (hash23(vec3(texel + dim*u_random.xy, frame))-0.5);

    if (u_init > 0.) {
        out0 = vec4(XYo, XYo, Zo, 0.);
    }

}