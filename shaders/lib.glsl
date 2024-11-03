#define pi 3.141592653589793
#define twopi (pi*2.)

//  color corrections
float luma(vec3 color) {
    // https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
    const vec3 luminosityFactor = vec3(0.2126, 0.7152, 0.0722);
    return (dot(color, luminosityFactor));
}
vec3 asGrayscale(vec3 color) {
    // https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
    const vec3 luminosityFactor = vec3(0.2126, 0.7152, 0.0722);
    return vec3(dot(color, luminosityFactor));
}
// 0 is no change
vec3 adjustBrightness(vec3 color, float value) {
  return color + value;
}
// 0 is no change
vec3 adjustExposure(vec3 color, float value) {
  return (1.0 + value) * color;
}
// value is -1..1
// 0 is no change
vec3 adjustContrast(vec3 color, float value) {
  return 0.5 + (1.0 + value) * (color - 0.5);
}
// 0 is no change
vec3 adjustSaturation(vec3 color, float value) {
  return mix(asGrayscale(color), color, 1.0 + value);
}




// distance from point p to the nearest point on the line a->b
float line (vec2 p, vec2 a, vec2 b) {
    // position on line a+tb
    float t = dot(p-a,b-a)/dot(b-a,b-a); 
    // clamp to line bounds:
    t = clamp(t,0.,1.);
    // nearest point:
    vec2 n = a + t*(b-a);
    // distance to that point:
	return length(p-n);
}

mat2 rotate_mat(float a) {
	float s = sin(a);
	float c = cos(a);
	return mat2(c, s, -s, c);
}


mat3 rotation3dX(float angle) {
  float s = sin(angle);
  float c = cos(angle);

  return mat3(
    1.0, 0.0, 0.0,
    0.0, c, s,
    0.0, -s, c
  );
}
mat3 rotation3dY(float angle) {
  float s = sin(angle);
  float c = cos(angle);

  return mat3(
    c, 0.0, -s,
    0.0, 1.0, 0.0,
    s, 0.0, c
  );
}
mat3 rotation3dZ(float angle) {
  float s = sin(angle);
  float c = cos(angle);

  return mat3(
    c, s, 0.0,
    -s, c, 0.0,
    0.0, 0.0, 1.0
  );
}
mat4 rotation3d(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat4(
    oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
    0.0,                                0.0,                                0.0,                                1.0
  );
}
mat2 rotation2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);

  return mat2(
    c, -s,
    s, c
  );
}

vec3 rotateX(vec3 v, float angle) {
  return rotation3dX(angle) * v;
}
vec3 rotateY(vec3 v, float angle) {
  return rotation3dY(angle) * v;
}
vec3 rotateZ(vec3 v, float angle) {
  return rotation3dZ(angle) * v;
}

vec2 rotate(vec2 v, float angle) {
  return rotation2d(angle) * v;
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
  return (rotation3d(axis, angle) * vec4(v, 1.0)).xyz;
}




vec3 hsl2rgb( in vec3 c )
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );

    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
}

// A single iteration of Bob Jenkins' One-At-A-Time hashing algorithm.
uint hash( uint x ) {
    x += ( x << 10u );
    x ^= ( x >>  6u );
    x += ( x <<  3u );
    x ^= ( x >> 11u );
    x += ( x << 15u );
    return x;
}
// Compound versions of the hashing algorithm I whipped together.
uint hash( uvec2 v ) { return hash( v.x ^ hash(v.y)                         ); }
uint hash( uvec3 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z)             ); }
uint hash( uvec4 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z) ^ hash(v.w) ); }

// Construct a float with half-open range [0:1] using low 23 bits.
// All zeroes yields 0.0, all ones yields the next smallest representable value below 1.0.
float floatConstruct( uint m ) {
    const uint ieeeMantissa = 0x007FFFFFu; // binary32 mantissa bitmask
    const uint ieeeOne      = 0x3F800000u; // 1.0 in IEEE binary32
    m &= ieeeMantissa;                     // Keep only mantissa bits (fractional part)
    m |= ieeeOne;                          // Add fractional part to 1.0
    float  f = uintBitsToFloat( m );       // Range [1:2]
    return f - 1.0;                        // Range [0:1]
}

// Pseudo-random value in half-open range [0:1].
float random( float x ) { return floatConstruct(hash(floatBitsToUint(x))); }
float random( vec2  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
float random( vec3  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
float random( vec4  v ) { return floatConstruct(hash(floatBitsToUint(v))); }

float rand(float co) { return fract(sin(co*(91.3458)) * 47453.5453); }
float rand(vec2 co){ return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); }
float rand(vec3 co){ return rand(co.xy+rand(co.z)); }

vec4 blur5(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3333333333333333) * direction;
  color += texture2D(image, uv) * 0.29411764705882354;
  color += texture2D(image, uv + (off1 / resolution)) * 0.35294117647058826;
  color += texture2D(image, uv - (off1 / resolution)) * 0.35294117647058826;
  return color; 
}

vec4 blur52(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3333333333333333) * direction;
  vec2 off2 = vec2(1,-1)*vec2(1.3333333333333333) * direction;
  color += texture2D(image, uv) * 0.29411764705882354;
  color += texture2D(image, uv + (off1 / resolution)) * 0.5*0.35294117647058826;
  color += texture2D(image, uv - (off1 / resolution)) * 0.5*0.35294117647058826;
  color += texture2D(image, uv + (off2 / resolution)) * 0.5*0.35294117647058826;
  color += texture2D(image, uv - (off2 / resolution)) * 0.5*0.35294117647058826;
  return color; 
}

vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  color += texture2D(image, uv) * 0.2270270270;
  color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
  color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
  return color;
}


vec4 blur92(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off1b = vec2(1,-1)*vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  vec2 off2b = vec2(1,-1)*vec2(3.2307692308) * direction;
  color += texture2D(image, uv) * 0.2270270270;
  color += texture2D(image, uv + (off1 / resolution)) * 0.5*0.3162162162;
  color += texture2D(image, uv - (off1 / resolution)) * 0.5*0.3162162162;
  color += texture2D(image, uv + (off2 / resolution)) * 0.5*0.0702702703;
  color += texture2D(image, uv - (off2 / resolution)) * 0.5*0.0702702703;
  color += texture2D(image, uv + (off1b / resolution)) * 0.5*0.3162162162;
  color += texture2D(image, uv - (off1b / resolution)) * 0.5*0.3162162162;
  color += texture2D(image, uv + (off2b / resolution)) * 0.5*0.0702702703;
  color += texture2D(image, uv - (off2b / resolution)) * 0.5*0.0702702703;
  return color;
}

vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.411764705882353) * direction;
  vec2 off2 = vec2(3.2941176470588234) * direction;
  vec2 off3 = vec2(5.176470588235294) * direction;
  color += texture2D(image, uv) * 0.1964825501511404;
  color += texture2D(image, uv + (off1 / resolution)) * 0.2969069646728344;
  color += texture2D(image, uv - (off1 / resolution)) * 0.2969069646728344;
  color += texture2D(image, uv + (off2 / resolution)) * 0.09447039785044732;
  color += texture2D(image, uv - (off2 / resolution)) * 0.09447039785044732;
  color += texture2D(image, uv + (off3 / resolution)) * 0.010381362401148057;
  color += texture2D(image, uv - (off3 / resolution)) * 0.010381362401148057;
  return color;
}

vec4 blur(sampler2D image, vec2 uv, vec2 resolution, float size=4.0, float directions=32.0, float quality=16.0) {

  float PR = 1.;
    
    // // GAUSSIAN BLUR SETTINGS {{{
    // float Directions = 32.0; // BLUR DIRECTIONS (Default 16.0 - More is better but slower)
    // float Quality = 16.0; // BLUR QUALITY (Default 4.0 - More is better but slower)
    // float Size = 4.0; // BLUR SIZE (Radius)
    // // GAUSSIAN BLUR SETTINGS }}}
   
    vec2 Radius = size/resolution.xy;
    
    // Pixel colour
    vec4 Color = texture(image, uv);
    
    // Blur calculations
    for( float d = 0.0; d < twopi; d += twopi/directions) {
		  for(float i = 1.0/quality; i <= 1.0; i += 1.0/quality) {
			  Color += texture( image, uv+vec2(cos(d),sin(d))*Radius*i);		
      }
    }
    
    // Output to screen
    // Output to screen
    Color /= quality * directions + ((directions / 2.) - 1.);
    if(PR < 1.1){
        Color/=(((.5 + (PR / 2.))) - (PR / 8.));
    }
    return Color;
}

float wrap(float x, float m) {
  return mod(mod(x,m) + m, m);
}

// a 5x5 median filter adapted from https://casual-effects.com/research/McGuire2008Median/median5.pix
/*
Morgan McGuire and Kyle Whitson, 2006
Williams College
http://graphics.cs.williams.edu

Copyright (c) Morgan McGuire and Williams College, 2006
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
// uv is the 0..1 texcoord
// ut is 1/resolution, i.e. the size of a texel in texcoords
vec4 median5(sampler2D tex, vec2 uv, vec2 ut) {
    vec4 v[25];
    for(int dX = -2; dX <= 2; ++dX) {
        for(int dY = -2; dY <= 2; ++dY) {		
            vec2 offset = uv + ut*vec2(float(dX), float(dY));
                
            // If a pixel in the window is located at (x+dX, y+dY), put it at index (dX + R)(2R + 1) + (dY + R) of the
            // pixel array. This will fill the pixel array, with the top left pixel of the window at pixel[0] and the
            // bottom right pixel of the window at pixel[N-1].
            v[(dX + 2) * 5 + (dY + 2)] = vec4(texture(tex, offset));
        }
    }

    vec4 temp;
    #define s2(a, b)				temp = a; a = min(a, b); b = max(temp, b);
    #define t2(a, b)				s2(v[a], v[b]);
    #define t24(a, b, c, d, e, f, g, h)			t2(a, b); t2(c, d); t2(e, f); t2(g, h); 
    #define t25(a, b, c, d, e, f, g, h, i, j)		t24(a, b, c, d, e, f, g, h); t2(i, j);

    t25(0, 1,			3, 4,		2, 4,		2, 3,		6, 7);
    t25(5, 7,			5, 6,		9, 7,		1, 7,		1, 4);
    t25(12, 13,		11, 13,		11, 12,		15, 16,		14, 16);
    t25(14, 15,		18, 19,		17, 19,		17, 18,		21, 22);
    t25(20, 22,		20, 21,		23, 24,		2, 5,		3, 6);
    t25(0, 6,			0, 3,		4, 7,		1, 7,		1, 4);
    t25(11, 14,		8, 14,		8, 11,		12, 15,		9, 15);
    t25(9, 12,		13, 16,		10, 16,		10, 13,		20, 23);
    t25(17, 23,		17, 20,		21, 24,		18, 24,		18, 21);
    t25(19, 22,		8, 17,		9, 18,		0, 18,		0, 9);
    t25(10, 19,		1, 19,		1, 10,		11, 20,		2, 20);
    t25(2, 11,		12, 21,		3, 21,		3, 12,		13, 22);
    t25(4, 22,		4, 13,		14, 23,		5, 23,		5, 14);
    t25(15, 24,		6, 24,		6, 15,		7, 16,		7, 19);
    t25(3, 11,		5, 17,		11, 17,		9, 17,		4, 10);
    t25(6, 12,		7, 14,		4, 6,		4, 7,		12, 14);
    t25(10, 14,		6, 7,		10, 12,		6, 10,		6, 17);
    t25(12, 17,		7, 17,		7, 10,		12, 18,		7, 12);
    t24(10, 18,		12, 20,		10, 20,		10, 12);
    return v[12];
}



void sort2(inout vec4 a0, inout vec4 a1) {
	vec4 b0 = min(a0, a1);
	vec4 b1 = max(a0, a1);
	a0 = b0;
	a1 = b1;
}

void sort(inout vec4 a0, inout vec4 a1, inout vec4 a2, inout vec4 a3, inout vec4 a4) {
	sort2(a0, a1);
	sort2(a3, a4);
	sort2(a0, a2);
	sort2(a1, a2);
	sort2(a0, a3);
	sort2(a2, a3);
	sort2(a1, a4);
	sort2(a1, a2);
	sort2(a3, a4);
}

vec4 median(sampler2D tex, vec2 uv, vec2 ut) {
    vec4 c0 = texture(tex, uv + ut*vec2(-2,0) );
    vec4 c1 = texture(tex, uv + ut*vec2(-1,0) );
    vec4 c2 = texture(tex, uv );
    vec4 c3 = texture(tex, uv + ut*vec2(-1,0) );
    vec4 c4 = texture(tex, uv + ut*vec2(-2,0) );
    
    vec4 c5 = texture(tex, uv + ut*vec2(0,-2) );
    vec4 c6 = texture(tex, uv + ut*vec2(0,-1) );
    vec4 c7 = texture(tex, uv + ut*vec2(0,1) );
    vec4 c8 = texture(tex, uv + ut*vec2(0,2) );
    
    sort(c0, c1, c2, c3, c4);
    sort(c5, c6, c2, c7, c8);
    
    return c2;
}