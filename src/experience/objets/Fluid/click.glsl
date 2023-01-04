uniform vec2 click;
uniform bool isClicked;
void handleClick(vec2 uv) {
  float r = .1;
  float x = (r - distance(uv, click / resolution.xy)) * 1. / r;
  x = smoothstep(0., 1., x);
  gl_FragColor.b = mix(gl_FragColor.b, 1.0, isClicked ? (x) : 0.0);
}
