#include 'uniforms.glsl'

const int NUM_DIRECTIONS = 8;
vec2 directions[NUM_DIRECTIONS] = vec2[](vec2(0.0, 1.0 / resolution.y), vec2(0.0, -1.0 / resolution.y), vec2(1.0 / resolution.x, 0.0), vec2(-1.0 / resolution.x, 0.0), vec2(1.0 / resolution.x, 1.0 / resolution.y), vec2(-1.0 / resolution.x, 1.0 / resolution.y), vec2(1.0 / resolution.x, -1.0 / resolution.y), vec2(-1.0 / resolution.x, -1.0 / resolution.y));

vec4 blur(vec2 uv, vec4 color) {
  // vec4 sum = color;
  vec4 sum = vec4(0.0);
  for(int i = 0; i < NUM_DIRECTIONS; i++) {
    sum += texture2D(textureValue, uv + directions[i]);
  }
  return sum / float(NUM_DIRECTIONS + 0);
}

float shape(float a) {
  // y = 1 - x^a
  return 1.0 - pow(a, 2.0);
}

vec3 fadeFn(vec3 color) {
  vec3 c = color * shape(fadePower);
  c = mix(c, vec3(0.0), fade);
  c = c / shape(fadePower);
  return c;

  return mix(color, vec3(0.0), fade);
}

vec2 rotate(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  mat2 m = mat2(c, -s, s, c);
  return m * v;
}

vec2 boundsCheck(vec2 pos) {
  return (pos.x > 0.0 && pos.x < 1.0 && pos.y > 0.0 && pos.y < 1.0) ? pos : vec2(-1.0);
}

vec3 getColor(vec2 uv) {
  bool isRedGroup = uv.x < 1.0 / 3.0;
  bool isGreenGroup = uv.x < 2.0 / 3.0;
  bool isBlueGroup = !isRedGroup && !isGreenGroup;
  return (isRedGroup) ? redColor : (isGreenGroup) ? greenColor : blueColor;
}
vec3 getColor(int i) {
  bool isRedGroup = i < count / 3;
  bool isGreenGroup = i < count * 2 / 3;
  bool isBlueGroup = !isRedGroup && !isGreenGroup;
  return (isRedGroup) ? redColor : (isGreenGroup) ? greenColor : blueColor;
}
