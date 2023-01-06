uniform vec2 click;
uniform bool isClicked;
uniform int clickMask;
uniform float brushSize;

float handleClick(vec2 uv) {
  float r = brushSize / resolution.x;
  float x = (r - distance(uv, click / resolution.xy)) * 1. / r;
  x = step(.1, x);
  return isClicked ? x : 0.0;
}

bool isInMask(int mask) {
  // bitcompare mask and clickMask
  return (mask & clickMask) == mask;
}
