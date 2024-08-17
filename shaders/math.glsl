// p is the vec3 position of the surface at the fragment.
// viewProjectionMatrix would be typically passed in as a uniform
// assign result to gl_FragDepth:
float computeDepth(vec3 p, mat4 viewProjectionMatrix) {
	float dfar = 1.;//gl_DepthRange.far;
	float dnear = 0.;//gl_DepthRange.near;
	vec4 clip_space_pos = viewProjectionMatrix * vec4(p, 1.);
	float ndc_depth = clip_space_pos.z / clip_space_pos.w;	
	// standard perspective:
	return (((dfar-dnear) * ndc_depth) + dnear + dfar) / 2.0;
}

// http://www.geeks3d.com/20141201/how-to-rotate-a-vertex-by-a-quaternion-in-glsl/
vec3 quat_rotate( vec4 q, vec3 v ){
	return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
}
vec4 quat_rotate( vec4 q, vec4 v ){
	return vec4(v.xyz + 2.0 * cross( q.xyz, cross( q.xyz, v.xyz ) + q.w * v.xyz), v.w );
}

// equiv. quat_rotate(quat_conj(q), v):
// q must be a normalized quaternion
vec3 quat_unrotate(in vec4 q, in vec3 v) {
	// return quat_mul(quat_mul(quat_conj(q), vec4(v, w)), q).xyz;
	// reduced:
	vec4 p = vec4(
				  q.w*v.x - q.y*v.z + q.z*v.y,  // x
				  q.w*v.y - q.z*v.x + q.x*v.z,  // y
				  q.w*v.z - q.x*v.y + q.y*v.x,  // z
				  q.x*v.x + q.y*v.y + q.z*v.z   // w
				  );
	return vec3(
				p.w*q.x + p.x*q.w + p.y*q.z - p.z*q.y,  // x
				p.w*q.y + p.y*q.w + p.z*q.x - p.x*q.z,  // y
				p.w*q.z + p.z*q.w + p.x*q.y - p.y*q.x   // z
				);
}

// equiv. quat_rotate(quat_conj(q), v):
// q must be a normalized quaternion
vec4 quat_unrotate(in vec4 q, in vec4 v) {
	// return quat_mul(quat_mul(quat_conj(q), vec4(v, w)), q).xyz;
	// reduced:
	vec4 p = vec4(
				  q.w*v.x - q.y*v.z + q.z*v.y,  // x
				  q.w*v.y - q.z*v.x + q.x*v.z,  // y
				  q.w*v.z - q.x*v.y + q.y*v.x,  // z
				  q.x*v.x + q.y*v.y + q.z*v.z   // w
				  );
	return vec4(
				p.w*q.x + p.x*q.w + p.y*q.z - p.z*q.y,  // x
				p.w*q.y + p.y*q.w + p.z*q.x - p.x*q.z,  // y
				p.w*q.z + p.z*q.w + p.x*q.y - p.y*q.x,  // z
				v.w
				);
}

vec4 quat_identity() { return vec4(0, 0, 0, 1); }

vec4 quat_conj(vec4 q) { return vec4(-q.xyz, q.w); }
//vec4 quat_conj(vec4 q) { return q * vec4(-1, -1, -1, 1); }

vec4 quat_mul(vec4 q1, vec4 q2) {
    return vec4(
        q2.xyz * q1.w + q1.xyz * q2.w + cross(q1.xyz, q2.xyz),
        q1.w * q2.w - dot(q1.xyz, q2.xyz)
    );
}

vec4 quat_scale(vec4 q, float s) {
    return vec4(q.xyz * s, q.w * s);
}

vec4 quat_random(vec3 seed) {
	// Implementation of http://planning.cs.uiuc.edu/node198.html
	float sqrt1MinusU1 = sqrt(1 - seed.x);
	float sqrtU1 = sqrt(seed.x);
	seed.yz *= 6.283185307179586476925286766559;
	return vec4(
		sqrt1MinusU1 * sin(seed.y),
		sqrt1MinusU1 * cos(seed.y),
		sqrtU1 * sin(seed.z),
		sqrtU1 * cos(seed.z)
	);
}

// create a quat from a forward and up vector:
vec4 quat(vec3 f, vec3 up) {
    vec3 right = normalize(cross(f, -up));
    up = normalize(cross(f, right));

    float m00 = right.x;
    float m01 = right.y;
    float m02 = right.z;
    float m10 = up.x;
    float m11 = up.y;
    float m12 = up.z;
    float m20 = f.x;
    float m21 = f.y;
    float m22 = f.z;

    float num8 = (m00 + m11) + m22;
    vec4 q = vec4(0, 0, 0, 1);
    if (num8 > 0.0) {
        float num = sqrt(num8 + 1.0);
        q.w = num * 0.5;
        num = 0.5 / num;
        q.x = (m12 - m21) * num;
        q.y = (m20 - m02) * num;
        q.z = (m01 - m10) * num;
        return q;
    }

    if ((m00 >= m11) && (m00 >= m22)) {
        float num7 = sqrt(((1.0 + m00) - m11) - m22);
        float num4 = 0.5 / num7;
        q.x = 0.5 * num7;
        q.y = (m01 + m10) * num4;
        q.z = (m02 + m20) * num4;
        q.w = (m12 - m21) * num4;
        return q;
    }

    if (m11 > m22) {
        float num6 = sqrt(((1.0 + m11) - m00) - m22);
        float num3 = 0.5 / num6;
        q.x = (m10 + m01) * num3;
        q.y = 0.5 * num6;
        q.z = (m21 + m12) * num3;
        q.w = (m20 - m02) * num3;
        return q;
    }

    float num5 = sqrt(((1.0 + m22) - m00) - m11);
    float num2 = 0.5 / num5;
    q.x = (m20 + m02) * num2;
    q.y = (m21 + m12) * num2;
    q.z = 0.5 * num5;
    q.w = (m01 - m10) * num2;
    return q;
}


vec4 quat_slerp(vec4 qa, vec4 qb, float t) {
    // qa = normalize(qa);
    // qb = normalize(qb);

    // Calculate angle between them.
    float cosHalfTheta = qa.w * qb.w + dot(qa.xyz, qb.xyz);
    
    // avoid taking the longer way: choose one representation
    qb = (cosHalfTheta < 0.0)? -qb : qb;
    // qb = (cosHalfTheta < 0.0)? quatNeg(qb) : qb;
    cosHalfTheta = (cosHalfTheta < 0.0)? -cosHalfTheta : cosHalfTheta;

    // if qa = qb or qa = -qb then theta = 0 and we can return qa
    if (abs(cosHalfTheta) >= 1.0) // greater-sign necessary for numerical stability
        return qa;

    // Calculate temporary values.
    float halfTheta = acos(cosHalfTheta);
    float sinHalfTheta = sqrt(1.0 - cosHalfTheta * cosHalfTheta); // NOTE: we checked above that |cosHalfTheta| < 1
    // if theta = pi then result is not fully defined
    // we could rotate around any axis normal to qa or qb
    if (abs(sinHalfTheta) < 0.001/*some epsilon*/)
        // return quatAdd( quatMul(qa, 0.5), quatMul(qb, 0.5));
        return normalize( qa * 0.5 + qb * 0.5 );

    float ratioA = sin((1.0 - t) * halfTheta) / sinHalfTheta;
    float ratioB = sin(t * halfTheta) / sinHalfTheta;

    // return quatNorm( quatAdd( quatMul(qa, ratioA), quatMul(qb, ratioB)) );
    return normalize( qa * ratioA + qb * ratioB );
}

vec4 quatFromAxisAngle(vec3 axis, float angle) {
    axis = normalize(axis);
    float c = cos(0.5 * angle);
    float s = sqrt(1.0 - c * c);
    return vec4(axis.x * s, axis.y * s, axis.z * s, c);
}

// get the rotation that will turn `q` 
// so that its local `fwd` vector 
// points in the same direction as `dir` (assumed normalized)
vec4 quat_rotation_to(vec4 q, vec3 dir, vec3 fwd=vec3(0,0,-1)) {
	vec4 res = quat_identity();
    // viewer's look direction in world space
    vec3 v = quat_rotate(q, fwd);
    // axis of rotation (not normalized)
    vec3 axis = cross(v, dir);
    float la = length(axis);
    float ld = length(dir);
    // skips rotation if a) we are too close, 
    // or b) we are pointing in opposite directions
    if (ld > 0.000001 && la > 0.000001) {
        float sin_a = la / ld;
        float cos_a = dot(v, dir) / ld;
        float a = atan(sin_a, cos_a);
        // n becomes axis, but must first be normalized:
        axis /= la;
        res = quatFromAxisAngle(axis, a);
    } 
	return res;
}

mat3 quat2mat3(vec4 q) {
    float qxx = q.x * q.x;
    float qyy = q.y * q.y;
    float qzz = q.z * q.z;
    float qxz = q.x * q.z;
    float qxy = q.x * q.y;
    float qyw = q.y * q.w;
    float qzw = q.z * q.w;
    float qyz = q.y * q.z;
    float qxw = q.x * q.w;
    return mat3(
        vec3(1.0 - 2.0 * (qyy + qzz), 2.0 * (qxy - qzw), 2.0 * (qxz + qyw)),
        vec3(2.0 * (qxy + qzw), 1.0 - 2.0 * (qxx + qzz), 2.0 * (qyz - qxw)),
        vec3(2.0 * (qxz - qyw), 2.0 * (qyz + qxw), 1.0 - 2.0 * (qxx + qyy))
    );
}

vec4 quatFromMat3(mat3 m) {
    vec4 q = vec4(0, 0, 0, 1);
    float tr = m[0].x + m[1].y + m[2].z;

    if (tr > 0) { 
        float S = sqrt(tr+1.0) * 2.0; // S=4*qw 
        q.w = 0.25 * S;
        q.x = (m[2].y - m[1].z) / S;
        q.y = (m[0].z - m[2].x) / S; 
        q.z = (m[1].x - m[0].y) / S; 
    } else if ((m[0].x > m[1].y) && (m[0].x > m[2].z)) { 
        float S = sqrt(1.0 + m[0].x - m[1].y - m[2].z) * 2.0; // S=4*qx 
        q.w = (m[2].y - m[1].z) / S;
        q.x = 0.25 * S;
        q.y = (m[0].y + m[1].x) / S; 
        q.z = (m[0].z + m[2].x) / S; 
    } else if (m[1].y > m[2].z) { 
        float S = sqrt(1.0 + m[1].y - m[0].x - m[2].z) * 2.0; // S=4*qy
        q.w = (m[0].z - m[2].x) / S;
        q.x = (m[0].y + m[1].x) / S; 
        q.y = 0.25 * S;
        q.z = (m[1].z + m[2].y) / S; 
    } else { 
        float S = sqrt(1.0 + m[2].z - m[0].x - m[1].y) * 2.0; // S=4*qz
        q.w = (m[1].x - m[0].y) / S;
        q.x = (m[0].z + m[2].x) / S;
        q.y = (m[1].z + m[2].y) / S;
        q.z = 0.25 * S;
    }
    return q;
}


float map(float value, float min1, float max1, float min2, float max2) {
	return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float random(in float x) {
	return fract(sin(x) * 43758.5453);
}

float random(in vec2 st) {
	return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float random(in vec3 pos) {
	return fract(sin(dot(pos.xyz, vec3(70.9898, 78.233, 32.4355))) * 43758.5453123);
}

float random(in vec4 pos) {
	float dot_product = dot(pos, vec4(12.9898,78.233,45.164,94.673));
	return fract(sin(dot_product) * 43758.5453);
}

vec3 RANDOM_SCALE3 = vec3(.1031, .1030, .0973);
vec4 FANDOM_SCALE4 = vec4(1031, .1030, .0973, .1099);

vec2 random2(float p) {
    vec3 p3 = fract(vec3(p) * RANDOM_SCALE3);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx+p3.yz)*p3.zy);
}

vec2 random2(in vec2 st) {
    const vec2 k = vec2(.3183099, .3678794);
    st = st * k + k.yx;
    return -1. + 2. * fract(16. * k * fract(st.x * st.y * (st.x + st.y)));
}

vec2 random2(vec3 p3) {
    p3 = fract(p3 * RANDOM_SCALE3);
    p3 += dot(p3, p3.yzx+19.19);
    return fract((p3.xx+p3.yz)*p3.zy);
}

vec3 random3(float p) {
    vec3 p3 = fract(vec3(p) * RANDOM_SCALE3);
    p3 += dot(p3, p3.yzx+19.19);
    return fract((p3.xxy+p3.yzz)*p3.zyx); 
}

vec3 random3(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE3);
    p3 += dot(p3, p3.yxz+19.19);
    return fract((p3.xxy+p3.yzz)*p3.zyx);
}

vec3 random3(in vec3 p) {
    p = vec3( dot(p, vec3(127.1, 311.7, 74.7)),
            dot(p, vec3(269.5, 183.3, 246.1)),
            dot(p, vec3(113.5, 271.9, 124.6)));
    return -1. + 2. * fract(sin(p) * 43758.5453123);
}

vec4 random4(float p) {
    vec4 p4 = fract(vec4(p) * FANDOM_SCALE4);
    p4 += dot(p4, p4.wzxy+19.19);
    return fract((p4.xxyz+p4.yzzw)*p4.zywx);   
}

vec4 random4(vec2 p) {
    vec4 p4 = fract(vec4(p.xyxy) * FANDOM_SCALE4);
    p4 += dot(p4, p4.wzxy+19.19);
    return fract((p4.xxyz+p4.yzzw)*p4.zywx);
}

vec4 random4(vec3 p) {
    vec4 p4 = fract(vec4(p.xyzx)  * FANDOM_SCALE4);
    p4 += dot(p4, p4.wzxy+19.19);
    return fract((p4.xxyz+p4.yzzw)*p4.zywx);
}

vec4 random4(vec4 p4) {
    p4 = fract(p4  * FANDOM_SCALE4);
    p4 += dot(p4, p4.wzxy+19.19);
    return fract((p4.xxyz+p4.yzzw)*p4.zywx);
}

float within(in float x, in float _min, in float _max) {
    return step(_min, x) * (1. - step(_max, x));
}

float within(in vec2 x, in vec2 _min, in vec2 _max) {
    vec2 rta = step(_min, x) * (1. - step(_max, x));
    return rta.x * rta.y;
}

float within(in vec3 x, in vec3 _min, in vec3 _max) {
    vec3 rta = step(_min, x) * (1. - step(_max, x));
    return rta.x * rta.y * rta.z;
}

float within(in vec4 x, in vec4 _min, in vec4 _max) {
    vec4 rta = step(_min, x) * (1. - step(_max, x));
    return rta.x * rta.y * rta.z * rta.w;
}

// polynomial smooth min
// from iq: https://iquilezles.org/articles/smin
float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float smax(float a,float b,float k){ return -smin(-a,-b,k);}

float inverse(float m) { return 1.0 / m; }

mat2 inverse(mat2 m) {
    return mat2(m[1][1],-m[0][1],
                -m[1][0], m[0][0]) / (m[0][0]*m[1][1] - m[0][1]*m[1][0]);
}

mat3 inverse(mat3 m) {
    float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];
    float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];
    float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];

    float b01 = a22 * a11 - a12 * a21;
    float b11 = -a22 * a10 + a12 * a20;
    float b21 = a21 * a10 - a11 * a20;

    float det = a00 * b01 + a01 * b11 + a02 * b21;

    return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11),
                b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),
                b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;
}

mat4 inverse(mat4 m) {
    float
            a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
            a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
            a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
            a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

            b00 = a00 * a11 - a01 * a10,
            b01 = a00 * a12 - a02 * a10,
            b02 = a00 * a13 - a03 * a10,
            b03 = a01 * a12 - a02 * a11,
            b04 = a01 * a13 - a03 * a11,
            b05 = a02 * a13 - a03 * a12,
            b06 = a20 * a31 - a21 * a30,
            b07 = a20 * a32 - a22 * a30,
            b08 = a20 * a33 - a23 * a30,
            b09 = a21 * a32 - a22 * a31,
            b10 = a21 * a33 - a23 * a31,
            b11 = a22 * a33 - a23 * a32,

            det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  return mat4(
                a11 * b11 - a12 * b10 + a13 * b09,
                a02 * b10 - a01 * b11 - a03 * b09,
                a31 * b05 - a32 * b04 + a33 * b03,
                a22 * b04 - a21 * b05 - a23 * b03,
                a12 * b08 - a10 * b11 - a13 * b07,
                a00 * b11 - a02 * b08 + a03 * b07,
                a32 * b02 - a30 * b05 - a33 * b01,
                a20 * b05 - a22 * b02 + a23 * b01,
                a10 * b10 - a11 * b08 + a13 * b06,
                a01 * b08 - a00 * b10 - a03 * b06,
                a30 * b04 - a31 * b02 + a33 * b00,
                a21 * b02 - a20 * b04 - a23 * b00,
                a11 * b07 - a10 * b09 - a12 * b06,
                a00 * b09 - a01 * b07 + a02 * b06,
                a31 * b01 - a30 * b03 - a32 * b00,
                a20 * b03 - a21 * b01 + a22 * b00) / det;
}

mat4 mat4_fromAxisAngle(in vec3 a, in float r) {
    a = normalize(a);
    float s = sin(r);
    float c = cos(r);
    float oc = 1.0 - c;

    return mat4(oc * a.x * a.x + c,           oc * a.x * a.y - a.z * s,  oc * a.z * a.x + a.y * s,  0.0,
                oc * a.x * a.y + a.z * s,  oc * a.y * a.y + c,           oc * a.y * a.z - a.x * s,  0.0,
                oc * a.z * a.x - a.y * s,  oc * a.y * a.z + a.x * s,  oc * a.z * a.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

mat4 mat4_fromQuat(vec4 q) {
  float x = q.x, y = q.y, z = q.z, w = q.w;
  float x2 = x + x;
  float y2 = y + y;
  float z2 = z + z;
  float xx = x * x2;
  float xy = x * y2;
  float xz = x * z2;
  float yy = y * y2;
  float yz = y * z2;
  float zz = z * z2;
  float wx = w * x2;
  float wy = w * y2;
  float wz = w * z2;
  return mat4(1 - (yy + zz), xy + wz, xz - wy, 0,
              xy - wz, 1 - (xx + zz), yz + wx, 0,
              xz + wy, yz - wx, 1 - (xx + yy), 0,
              0, 0, 0, 1);
}

mat4 mat4_fromTranslation(vec3 t) {
    return mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        t.x, t.y, t.z, 1.0
    );
}

mat4 mat4_fromScale(vec3 s) {
    return mat4(
        s.x, 0.0, 0.0, 0.0,
        0.0, s.y, 0.0, 0.0,
        0.0, 0.0, s.z, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}



// rotate, then scale, then translate:
mat4 mat4_fromPosQuatScale(vec3 pos, vec4 q, vec3 s) {
	float x = q.x, y = q.y, z = q.z, w = q.w;
	float x2 = x + x;
	float y2 = y + y;
	float z2 = z + z;
	float xx = x * x2;
	float xy = x * y2;
	float xz = x * z2;
	float yy = y * y2;
	float yz = y * z2;
	float zz = z * z2;
	float wx = w * x2;
	float wy = w * y2;
	float wz = w * z2;

	vec3 X = vec3(1 - (yy + zz), xy + wz, xz - wy) * s.x;
	vec3 Y = vec3(xy - wz, 1 - (xx + zz), yz + wx) * s.y;
	vec3 Z = vec3(xz + wy, yz - wx, 1 - (xx + yy)) * s.z;

	return mat4(X, 0,
				Y, 0,
				Z, 0,
				pos, 1);
}

// rotate, then scale, then translate:
mat4 mat4_fromPosQuatScaleInverse(vec3 pos, vec4 q, vec3 s) {
    return mat4_fromScale(1./s) * 
        mat4_fromQuat(quat_conj(q)) * 
        mat4_fromTranslation(-pos);
}

mat4 mat4_fromMat3(mat3 m) {
    return mat4(vec4(m[0], 0.0), 
                vec4(m[1], 0.0), 
                vec4(m[2], 0.0), 
                vec4(0.0, 0.0, 0.0, 1.0) );
}

float farFromProjMatrix(mat4 m) {
    return m[3].z / (m[2].z + 1.0);
}

float nearFromProjMatrix(mat4 m) {
    return m[3].z / (m[2].z - 1.0);
}

// in radians
float fovFromProjMatrix(mat4 m) {
    return 2.0 * atan(1.0/m[1].y);
}

vec3 eyeFromViewMatrix(mat4 m) {
    return -(m[3].xyz)*mat3(m);
}

mat3 rotX(float a) {
    return mat3(1., 0., 0.,
                0., cos(a), sin(a),
                0., -sin(a), cos(a));
}

mat3 rotY(float a) {
    return mat3(cos(a), 0., sin(a),
                0., 1., 0.,
                -sin(a), 0., cos(a));
}

mat3 rotZ(float a) {
    return mat3(cos(a), sin(a), 0.,
                -sin(a), cos(a), 0.,
                0., 0., 1.);
}

float hue2rgb(float f1, float f2, float hue) {
    if (hue < 0.0)
        hue += 1.0;
    else if (hue > 1.0)
        hue -= 1.0;
    float res;
    if ((6.0 * hue) < 1.0)
        res = f1 + (f2 - f1) * 6.0 * hue;
    else if ((2.0 * hue) < 1.0)
        res = f2;
    else if ((3.0 * hue) < 2.0)
        res = f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
    else
        res = f1;
    return res;
}

vec3 hsl2rgb(vec3 hsl) {
    vec3 rgb;
    
    if (hsl.y == 0.0) {
        rgb = vec3(hsl.z); // Luminance
    } else {
        float f2;
        
        if (hsl.z < 0.5)
            f2 = hsl.z * (1.0 + hsl.y);
        else
            f2 = hsl.z + hsl.y - hsl.y * hsl.z;
            
        float f1 = 2.0 * hsl.z - f2;
        
        rgb.r = hue2rgb(f1, f2, hsl.x + (1.0/3.0));
        rgb.g = hue2rgb(f1, f2, hsl.x);
        rgb.b = hue2rgb(f1, f2, hsl.x - (1.0/3.0));
    }   
    return rgb;
}

vec3 hsl2rgb(float h, float s, float l) {
    return hsl2rgb(vec3(h, s, l));
}

float rgb2sat(vec3 rgb) {
    // Algorithm from Chapter 16 of OpenGL Shading Language
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    return (dot(rgb, W));
}

// vec3 greyScale = rgbSaturate(color, 0.0);
// vec3 doubleSaturation = rgbSaturate(color, 2.0);
vec3 rgbSaturate(vec3 rgb, float adjustment) {
    vec3 intensity = vec3(rgb2sat(rgb));
    return mix(intensity, rgb, adjustment);
}

// returns t0,t1, values of t in ro+t*rd
// that is, the start and end point of the section of the ray that intersects with the sphere
// if there is no intersection, t1 == 0 (aka t0 > t1)
// this can be used to set up the initial t and tmax for a raymarch through a bounding sphere
vec2 intersectSphere(vec3 ro, vec3 rd, vec3 org, float rad) {
   float a = dot(rd, rd);
   float b = 2.*dot(rd, ro - org);
   float c = dot(ro - org, ro - org) - rad*rad;
   float desc = b*b - 4.*a*c;
   if (desc < 0.)
      return vec2(1, 0);

   return vec2((-b - sqrt(desc)) / (2.*a), (-b + sqrt(desc)) / (2.*a));
}

// distributes n points on the surface of a sphere using fibonnacci spiral distribution
// Originally from https://www.shadertoy.com/view/lllXz4
// Modified by fizzer to put out the vector q.
// p is the direction vector to sample at (should be normalized)
// n is the number of points (min 3)
// return x is the nearest point id (0..n) to 'p'
// return y is the distance from that point
// outq is ?
vec2 inverseSF( vec3 p, float n, out vec3 outq ) {
    const float pi  = 3.14159265359;
    const float c_phi = 1.61803398875;

    float m = 1.0 - 1.0/n;
    
    float phi = min(atan(p.y, p.x), pi), cosTheta = p.z;
    
    float k  = max(2.0, floor( log(n * pi * sqrt(5.0) * (1.0 - cosTheta*cosTheta))/ log(c_phi+1.0)));
    float Fk = pow(c_phi, k)/sqrt(5.0);
    vec2  F  = vec2( round(Fk), round(Fk * c_phi) ); // k, k+1

    vec2 ka = 2.0*F/n;
    vec2 kb = 2.0*pi*( fract((F+1.0)*c_phi) - (c_phi-1.0) );    
    
    mat2 iB = mat2( ka.y, -ka.x, 
                    kb.y, -kb.x ) / (ka.y*kb.x - ka.x*kb.y);
    
    vec2 c = floor( iB * vec2(phi, cosTheta - m));
    float d = 8.0;
    float j = 0.0;
    for( int s=0; s<4; s++ ) 
    {
        vec2 uv = vec2( float(s-2*(s/2)), float(s/2) );
        
        float i = round(dot(F, uv + c));
        
        float phi = 2.0*pi*fract(i*c_phi);
        float cosTheta = m - 2.0*i/n;
        float sinTheta = sqrt(1.0 - cosTheta*cosTheta);
        
        vec3 q = vec3( cos(phi)*sinTheta, sin(phi)*sinTheta, cosTheta );
        float squaredDistance = dot(q-p, q-p);
        if (squaredDistance < d) 
        {
            outq = q;
            d = squaredDistance;
            j = i;
        }
    }
    return vec2( j, sqrt(d) );
}