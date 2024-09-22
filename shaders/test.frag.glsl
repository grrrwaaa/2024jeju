#version 330
precision mediump float;

uniform sampler2D u_tex;

in vec2 v_uv;

layout(location = 0) out vec4 out_color;

void main() {
    out_color = vec4(v_uv, 0, 1);

    // float p = 100.;

    // float xy1 = exp(-p*abs(v_uv.x - v_uv.y));
    // float xy2 = exp(-p*abs(v_uv.x + v_uv.y - 1.));

    // float x1 = exp(-p*(0.5-abs(v_uv.x - 0.5)));
    // float y1 = exp(-p*(0.5-abs(v_uv.y - 0.5)));

    // out_color = vec4(x1, y1, max(xy1, xy2), 1);

	out_color = texture(u_tex, v_uv);
}