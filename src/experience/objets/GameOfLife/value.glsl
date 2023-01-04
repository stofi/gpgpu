uniform float time;
uniform float delta;
uniform vec2 click;
uniform bool isClicked;
uniform bool separateRGB;

const int NUM_DIRECTIONS = 8;
vec2 directions[NUM_DIRECTIONS] = vec2[](vec2(0.0, 1.0 / resolution.y), vec2(0.0, -1.0 / resolution.y), vec2(1.0 / resolution.x, 0.0), vec2(-1.0 / resolution.x, 0.0), vec2(1.0 / resolution.x, 1.0 / resolution.y), vec2(-1.0 / resolution.x, 1.0 / resolution.y), vec2(1.0 / resolution.x, -1.0 / resolution.y), vec2(-1.0 / resolution.x, -1.0 / resolution.y));

bool customSample(vec2 dUv, vec3 mask) {
  vec4 _v = texture2D(textureValue, dUv);
  mask = normalize(mask);
  float r = _v.x * mask.x;
  float g = _v.y * mask.y;
  float b = _v.z * mask.z;
  return r + g + b > 0.5;
}

bool sampleNeighbour(vec2 dUv, vec2 offset, vec3 mask) {
  return customSample(dUv + offset, mask);
}

int countNeighbours(vec2 dUv, vec3 mask) {
  int count = 0;
  for(int i = 0; i < NUM_DIRECTIONS; i++) {
    if(sampleNeighbour(dUv, directions[i], mask)) {
      count++;
    }
  }
  return count;
}

bool gameOfLife(vec2 dUv, vec3 mask) {
  int count = countNeighbours(dUv, mask);
  bool alive = customSample(dUv, mask);
  vec2 cUv = click / resolution.xy;
  float unit = 1.0 / resolution.x;

  float dist = distance(cUv, dUv);
  if(dist < unit && isClicked) {
    return true;
  }

  if(alive) {
    if(count < 2)
      return false;
    if(count > 3)
      return false;
    return true;
  } else {
    if(count == 3)
      return true;
    return false;
  }
}

void main() {

  vec2 uv = gl_FragCoord.xy / resolution.xy;

  if(separateRGB) {
    bool r = gameOfLife(uv, vec3(1., 0., 0.));
    bool g = gameOfLife(uv, vec3(0., 1., 0.));
    bool b = gameOfLife(uv, vec3(0., 0., 1.));

    gl_FragColor.r = r ? 1.0 : 0.0;
    gl_FragColor.g = g ? 1.0 : 0.0;
    gl_FragColor.b = b ? 1.0 : 0.0;
  } else {
    bool r = gameOfLife(uv, vec3(1., 1., 1.));
    gl_FragColor.r = r ? 1.0 : 0.0;
    gl_FragColor.g = r ? 1.0 : 0.0;
    gl_FragColor.b = r ? 1.0 : 0.0;
  }

}
