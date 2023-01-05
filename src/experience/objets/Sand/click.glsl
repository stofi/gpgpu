uniform vec2 click;
uniform bool isClicked;

float handleClick(vec2 uv) {
  float r = .05;
  float x = (r - distance(uv, click / resolution.xy)) * 1. / r;
  x = step(.1, x);
  return isClicked ? x : 0.0;
}
