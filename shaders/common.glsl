

vec2 getDrift(float t, float dt, float descend, float drift_amount, vec3 spherical, mat3 xyz2uv, out vec3 drift) {
    drift = vec3(8*sin(t), 5*sin(t*0.654), 4*(cos(t)-0.3)); // rotate(vec3(1, 0, 0), spherical, t);
    //drift = v_normal * 4.;
    //drift += rotate(vec3(5, 0, 0), spherical, -t) + vec3(0, 0, -3);
    drift = 0.5*vec3(3.*sin(t + 5*spherical.z), -descend - 3*cos(0.1*t), -4*(cos(t + 2.*spherical.x)+0.));
    drift *= drift_amount * 0.75;
    vec2 duv = (xyz2uv * drift).xy;
    return duv * dt/0.02;
}

// how to get drift for a specific pixel or uv coordinate?
// it depends on cubical and xyz2uv
// cubical was read from color input, which 


void coordinates1(vec3 normal, vec3 spherical, vec3 wall_u, out mat3 uv2xyz, out mat3 xyz2uv) {
    vec3 sphnormal = -spherical;
    // get UV vectors in 3D space:
    vec3 unit_u = normalize(wall_u);
    vec3 unit_v = normalize(cross(sphnormal, unit_u));
    // one more to get it properly spherical:
    unit_u = normalize(cross(unit_v, sphnormal));
    // get conversion matrices between spaces:
    // result.xyz in in 3D space. input.z is along normal (typically 0?)
    uv2xyz = mat3(unit_u, unit_v, sphnormal);
    // result.xy is in UV space (result.z is along normal):
    xyz2uv = transpose(uv2xyz);
}