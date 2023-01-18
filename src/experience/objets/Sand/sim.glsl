uniform vec3 brushColor;
uniform bool enableDiagonal;
uniform bool enableSlide;

#include "click.glsl"

const vec2 pixelSize = vec2(1.) / resolution.xy;
#include "common.glsl"

const int mask = 1;

bool willMove(vec2 uv) {
  if(!isCellActive(uv))
    return true;
  if(isSolid(uv))
    return true;
  bool moveDown = canFallDown(uv);
  bool moveDownRight = canFallToRight(uv);
  bool moveDownLeft = canFallToLeft(uv);
  bool moveRight = canSlideRight(uv);
  bool moveLeft = canSlideLeft(uv);
  if(moveDown)
    return true;
  if(enableSlide && (moveRight || moveLeft))
    return true;
  if(enableDiagonal && (moveDownRight || moveDownLeft))
    return true;

  return false;
}

vec4 sim() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  bool solid = isSolid(uv);
  if(solid)
    return texture2D(textureSolid, uv);

  if(isCellActive(uv) && !willMove(uv))
    return texture2D(textureValue, uv);

  vec4 result = vec4(0.0, 0.0, 0.0, 0.0);
  vec2 aboveUv = uv + pixelSize * vec2(0., 1.);
  vec2 leftUv = uv + pixelSize * vec2(-1., 0.);
  vec2 rightUv = uv + pixelSize * vec2(1., 0.);
  vec2 leftAboveUv = uv + pixelSize * vec2(-1., 1.);
  vec2 rightAboveUv = uv + pixelSize * vec2(1., 1.);

  bool aboveMoveDown = canFallDown(aboveUv);
  bool aboveRightMoveDownLeft = canFallToLeft(rightAboveUv);
  bool aboveLeftMoveDownRight = canFallToRight(leftAboveUv);
  bool leftMoveRight = canSlideRight(leftUv);
  bool rightMoveLeft = canSlideLeft(rightUv);

  bool aboveOut = aboveUv.y > 1.;
  bool leftOut = leftUv.x < 0.;
  bool rightOut = rightUv.x > 1.;
  bool leftAboveOut = leftAboveUv.x < 0. || leftAboveUv.y > 1.;
  bool rightAboveOut = rightAboveUv.x > 1. || rightAboveUv.y > 1.;

  if(!aboveOut && aboveMoveDown && !isSolid(aboveUv))
    result = texture2D(textureValue, aboveUv);
  else if(enableSlide && !leftOut && leftMoveRight && !isSolid(leftUv))
    result = texture2D(textureValue, leftUv);
  else if(enableSlide && !rightOut && rightMoveLeft && !isSolid(rightUv))
    result = texture2D(textureValue, rightUv);
  else if(enableDiagonal && !leftAboveOut && aboveLeftMoveDownRight && !isSolid(leftAboveUv))
    result = texture2D(textureValue, leftAboveUv);
  else if(enableDiagonal && !rightAboveOut && aboveRightMoveDownLeft && !isSolid(rightAboveUv))
    result = texture2D(textureValue, rightAboveUv);

  if(isCellActive(uv) || result != vec4(0.0, 0.0, 0.0, 0.0))
    return result;
  else
    return texture2D(textureValue, uv);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float c = 0.;

  bool isClickedHere = isInMask(mask);
  if(isClickedHere) {
    c = handleClick(uv);
  }
  vec4 brush = vec4(brushColor, 1.);

  if(isInMask(3)) {
    brush = vec4(0.);
    c = handleClick(uv);
  }

  gl_FragColor = sim();
  gl_FragColor = mix(gl_FragColor, brush, c);

}
