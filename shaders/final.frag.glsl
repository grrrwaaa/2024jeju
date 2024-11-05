#version 330
precision mediump float;

uniform sampler2D u_tex;

in vec2 v_uv;

layout(location = 0) out vec4 out0;

// "zero" value of the velocity vector
float XYo = 0.;

vec3 hsl2rgb( in vec3 c )
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
}

void main() {
    out0 = vec4(v_uv, 0, 1);
	vec4 a = texture(u_tex, v_uv);
    out0 = a;

    //out0.rgb = 1.-a.www * hsl2rgb(vec3(0.5*dot(a.xy-XYo, vec2(1,0)), abs(a.z-0.5), 0.85));
    
}