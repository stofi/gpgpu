uniform float time;
uniform float noiseScale;
uniform float noiseScale2;
uniform float reverseVelocityMixFactor;
uniform float velocityThreshold;
uniform float smoothFactor;
uniform bool brushColorRandom;
uniform vec3 brushColor;
uniform bool enableDiagonal;
uniform bool enableSlide;

#include "opensimplex.glsl"
#include "click.glsl"

const vec2 pixelSize = vec2(1.) / resolution.xy;
#include "common.glsl"

const int mask = 1;

float getNoise(vec2 uv) {
  vec4 n = openSimplex2SDerivativesPart(vec3(uv * resolution.xy, time));
  return (n.x + n.y + n.z + n.w) / 4.;
}

bool willMove(vec2 uv) {
  if(canFallDown(uv) || (enableDiagonal && (canFallToRight(uv) || canFallToLeft(uv)))) {
    return true;
  }
  if(enableSlide && (canSlideRightFirst(uv) || canSlideLeft(uv))) {
    return true;
  }

  return false;
}
vec4 cellToMoveInto(vec2 uv) {
  vec4 result = vec4(0.0, 0.0, 0.0, 0.0);
  vec2 aboveUv = uv + pixelSize * vec2(0., 1.);
  vec2 leftUv = uv + pixelSize * vec2(-1., 0.);
  vec2 rightUv = uv + pixelSize * vec2(1., 0.);
  vec2 leftAboveUv = uv + pixelSize * vec2(-1., 1.);
  vec2 rightAboveUv = uv + pixelSize * vec2(1., 1.);
  if(aboveUv.y > 1.)
    return result;
  if(canFallDown(aboveUv)) {
    return texture2D(textureValue, aboveUv);
  }
  if(enableDiagonal) {
    if(canFallToRight(leftAboveUv)) {
      return texture2D(textureValue, leftAboveUv);
    }
    if(canFallToLeft(rightAboveUv)) {
      return texture2D(textureValue, rightAboveUv);
    }
  }
  if(enableSlide) {
    if(canSlideRightFirst(leftUv)) {
      return texture2D(textureValue, leftUv);
    }
    if(canSlideLeft(rightUv)) {
      return texture2D(textureValue, rightUv);
    }
  }
  return result;
}
vec4 sim() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  bool solid = isSolid(uv);
  if(solid)
    return texture2D(textureSolid, uv);

  if(willMove(uv) || !isCellActive(uv))
    return cellToMoveInto(uv);

  return texture2D(textureValue, uv);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float c = 0.;
  float noise = getNoise(uv);
  bool isClickedHere = isInMask(mask);
  if(isClickedHere) {
    c = handleClick(uv);
  }
  vec4 brush = vec4(brushColor, 1.);
  if(brushColorRandom) {
    brush = openSimplex2SDerivativesPart(vec3(uv, time));
    brush.w = 1.;
    brush = brush * 0.5 + 0.5;
    brush = normalize(brush);
  }
  if(isInMask(3)) {
    brush = vec4(0.);
    c = handleClick(uv);
  }

  gl_FragColor = sim();
  gl_FragColor = mix(gl_FragColor, brush, c);

}
