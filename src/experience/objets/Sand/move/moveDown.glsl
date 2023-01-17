uniform bool enableFall;

const vec2 pixelSize = vec2(1.) / resolution.xy;
#include "../common.glsl"

void main() {
  if(!enableFall) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  bool result = canFallDown(uv);

  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  if(result) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
}
