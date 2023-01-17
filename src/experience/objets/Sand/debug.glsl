uniform bool enableFall;
uniform bool enableDiagonal;
uniform bool enableSlide;

const vec2 pixelSize = vec2(1.) / resolution.xy;
#include "common.glsl"

vec4 cellToMoveInto(vec2 uv) {
  vec4 result = vec4(0.);
  vec2 aboveUv = uv + pixelSize * vec2(0., 1.);
  vec2 leftUv = uv + pixelSize * vec2(-1., 0.);
  vec2 rightUv = uv + pixelSize * vec2(1., 0.);
  vec2 leftAboveUv = uv + pixelSize * vec2(-1., 1.);
  vec2 rightAboveUv = uv + pixelSize * vec2(1., 1.);

  bool aboveMoveDown = texture2D(textureMoveDown, aboveUv).x > 0.;
  bool aboveRightMoveDownLeft = texture2D(textureMoveDownLeft, rightAboveUv).x > 0.;
  bool aboveLeftMoveDownRight = texture2D(textureMoveDownRight, leftAboveUv).x > 0.;
  bool leftMoveRight = texture2D(textureMoveRight, leftUv).x > 0.;
  bool rightMoveLeft = texture2D(textureMoveLeft, rightUv).x > 0.;

  if(aboveMoveDown)
    result += vec4(.1, .1, 0.1, 0.);

  if(enableDiagonal && (aboveRightMoveDownLeft || aboveLeftMoveDownRight)) {
    if(aboveLeftMoveDownRight)
      result += vec4(.0, 0.5, 0., 0.);
    if(aboveRightMoveDownLeft)
      result += vec4(.5, 0, 0., 0.);

  }
  if(enableSlide && (leftMoveRight || rightMoveLeft)) {
    if(leftMoveRight)
      result += vec4(.0, 0, 0.5, 0.);

    if(rightMoveLeft)
      result += vec4(.0, 0, 0.5, 0.);
  }
  return result;
}
const vec4 red = vec4(1., 0., 0., 1.);
const vec4 green = vec4(0., 1., 0., 1.);
void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 tex = texture2D(textureValue, uv);
  tex.rgb /= 4.;
  tex.rgb += cellToMoveInto(uv).rgb;
  gl_FragColor = tex;
  // gl_FragColor = cellToMoveInto(uv);
}
