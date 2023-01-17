uniform bool enableSlide;

const vec2 pixelSize = vec2(1.) / resolution.xy;
#include "../common.glsl"

void main() {
  if(!enableSlide) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  bool canMoveDown = texture2D(textureMoveDown, uv).x > 0.5;
  if(canMoveDown) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  bool canMoveDownRight = texture2D(textureMoveDownRight, uv).x > 0.5;
  if(canMoveDownRight) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  bool canMoveDownLeft = texture2D(textureMoveDownLeft, uv).x > 0.5;
  if(canMoveDownLeft) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  bool canMoveRight = texture2D(textureMoveRight, uv).x > 0.5;
  if(canMoveRight) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  bool result = canSlideLeft(uv);

  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  if(result) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
}
