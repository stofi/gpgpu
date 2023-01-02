#include 'uniforms.glsl'

const int NUM_DIRECTIONS = 8;
vec2 directions[NUM_DIRECTIONS] = vec2[](vec2(0.0, 1.0 / resolution.y), vec2(0.0, -1.0 / resolution.y), vec2(1.0 / resolution.x, 0.0), vec2(-1.0 / resolution.x, 0.0), vec2(1.0 / resolution.x, 1.0 / resolution.y), vec2(-1.0 / resolution.x, 1.0 / resolution.y), vec2(1.0 / resolution.x, -1.0 / resolution.y), vec2(-1.0 / resolution.x, -1.0 / resolution.y));

vec4 blurChannel(vec2 uv, vec4 color, vec4 mask) {
  bool includeSelf = true;
  vec4 sum = includeSelf ? color * mask : vec4(vec3(0.0), 1.0);
  for(int i = 0; i < NUM_DIRECTIONS; i++) {
    sum += texture2D(textureValue, uv + directions[i]) * mask;
  }
  return sum / float(NUM_DIRECTIONS + (includeSelf ? 1 : 0));
}

vec4 blur(vec2 uv, vec4 color) {
  bool includeSelf = true;
  vec4 sum = includeSelf ? color : vec4(vec3(0.0), 1.0);
  for(int i = 0; i < NUM_DIRECTIONS; i++) {
    sum += texture2D(textureValue, uv + directions[i]);
  }
  return sum / float(NUM_DIRECTIONS + (includeSelf ? 1 : 0));
}

float shape(float a) {
  // y = 1 - x^a
  return 1.0 - pow(a, 2.0);
}

vec3 fadeFn(vec3 color) {
  // use 'fade' uniform to fade out the color

  return color - color * fade;
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

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 rotateHue(vec3 color, float hueShift) {
  float shift = hueShift + time * 0.000001;
  vec3 hsv = rgb2hsv(color);
  hsv.x += shift;
  hsv.x = mod(hsv.x, 1.0);
  return hsv2rgb(hsv);
}

vec3 getColor(vec2 uv) {
  float fr = 1.0 / float(groupCount);

  bool isRedGroup = uv.x < fr;
  bool isGreenGroup = uv.x < fr * 2.0;
  vec3 c = (isRedGroup) ? redColor : (isGreenGroup) ? greenColor : blueColor;
  c = rotateHue(c, 1.);
  return c;
}
vec3 getColor(int i) {
  float fr = float(count) / float(groupCount);
  bool isRedGroup = float(i) < fr;
  bool isGreenGroup = float(i) <= fr * 2.0;
  vec3 c = (isRedGroup) ? redColor : (isGreenGroup) ? greenColor : blueColor;
  c = rotateHue(c, 1.);
  return c;
}
