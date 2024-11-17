#version 330
precision mediump float;

uniform sampler2D u_tex;
uniform vec3 u_wall_u;
uniform float u_seconds;
uniform float u_lightness;
uniform float u_hue;
uniform float u_huerange;
uniform float u_saturation;
uniform float u_gamma;

in vec2 v_uv;
in vec3 v_normal;
in vec4 v_color;

layout(location = 0) out vec4 out0;

// "zero" value of the velocity vector
float XYo = 0.5;

vec3 hsl2rgb( in vec3 c )
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
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


    out0 = vec4(v_uv, 0, 1);
	vec4 input = texture(u_tex, v_uv);
    out0 = input;

    vec3 flow = uv2xyz * vec3(input.xy-XYo, 0);

    out0.rgb = (1.-input.w) * hsl2rgb(vec3(u_hue + u_huerange*dot(flow, vec3(-1, 0, 0)), u_saturation * abs(input.z-0.5), u_lightness));
    out0.rgb = pow(out0.rgb, vec3(u_gamma));
    //out0.rgb = 1.-input.www * hsl2rgb(vec3(0.5*sin(2.*length(input.xy)), abs(input.z-0.5), 0.85));
    //out0.rgb = 1.-input.www * hsl2rgb(vec3(0.5, 0.5, 0.85));
    //out0 = vec4(flow*0.5+0.5, 1);
    //out0 = input;
}