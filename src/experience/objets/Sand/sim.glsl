uniform float time;
uniform float noiseScale;
uniform float noiseScale2;
uniform float reverseVelocityMixFactor;
uniform float velocityThreshold;
uniform float smoothFactor;
uniform bool brushColorRandom;
uniform vec3 brushColor;
#include "opensimplex.glsl"
#include "click.glsl"

const vec2 pixelSize = vec2(1.) / resolution.xy;

const int mask = 1;

bool isSolid(vec2 uv) {
  vec4 state = texture2D(textureSolid, uv);
  return state.w > 0.01;
}

bool isCellActive(vec2 uv) {
  vec4 state = texture2D(textureValue, uv);
  return state.w > 0.01;
}

bool canFallDown(vec2 uv) {
  bool solid = isSolid(uv);
  if(solid)
    return false;
  bool state = isCellActive(uv);
  vec2 bellowUv = uv + pixelSize * vec2(0., -1.);
  bool bellow = isCellActive(bellowUv);
  float spaceBellowIsNotOutOfBounds = step(0.0, bellowUv.y);
  return state && !bellow && spaceBellowIsNotOutOfBounds > 0.;
}

bool canFallToRight(vec2 uv) {
  bool solid = isSolid(uv);
  if(solid)
    return false;
  bool state = isCellActive(uv);
  if(!state)
    return false;

  bool fallDown = canFallDown(uv);
  if(fallDown)
    return false;

  vec2 aboveUv = uv + pixelSize * vec2(0., 1.);
  bool above = isCellActive(aboveUv);
  if(above)
    return false;

  vec2 bellowUv = uv + pixelSize * vec2(0., -1.);
  if(bellowUv.y < 0.)
    return false;

  vec2 rightUv = uv + pixelSize * vec2(1., 0.);
  bool right = isCellActive(rightUv);
  if(right)
    return false;

  bool bellow = isCellActive(bellowUv);

  if(!bellow)
    return false;

  vec2 bellowRightUv = uv + pixelSize * vec2(1., -1.);
  bool bellowRight = isCellActive(bellowRightUv);
  float spaceBellowRightIsNotOutOfBounds = step(0.0, 1. - bellowRightUv.y);
  return !bellowRight && spaceBellowRightIsNotOutOfBounds > 0.;
}

bool canFallToLeft(vec2 uv) {
  bool solid = isSolid(uv);
  if(solid)
    return false;
  bool state = isCellActive(uv);
  if(!state)
    return false;

  bool fallDown = canFallDown(uv);
  if(fallDown)
    return false;

  bool fallRight = canFallToRight(uv);
  if(fallRight)
    return false;

  vec2 aboveUv = uv + pixelSize * vec2(0., 1.);
  bool above = isCellActive(aboveUv);
  if(above)
    return false;

  vec2 bellowUv = uv + pixelSize * vec2(0., -1.);
  if(bellowUv.y < 0.)
    return false;

  vec2 leftUv = uv + pixelSize * vec2(-1., 0.);
  bool left = isCellActive(leftUv);
  if(left)
    return false;

  bool bellow = isCellActive(bellowUv);

  if(!bellow)
    return false;

  vec2 bellowLeftUv = uv + pixelSize * vec2(-1., -1.);
  bool bellowLeft = isCellActive(bellowLeftUv);

  float spaceBellowLeftIsNotOutOfBounds = step(0.0, bellowLeftUv.y);
  return !bellowLeft && spaceBellowLeftIsNotOutOfBounds > 0.;
}

bool canSlideRight(vec2 uv) {
  bool solid = isSolid(uv);
  if(solid)
    return false;
  bool state = isCellActive(uv);
  if(!state)
    return false;

  bool fallDown = canFallDown(uv);
  if(fallDown)
    return false;

  bool fallRight = canFallToRight(uv);
  if(fallRight)
    return false;

  bool fallLeft = canFallToLeft(uv);
  if(fallLeft)
    return false;

  vec2 rigthAboveUv = uv + pixelSize * vec2(1., 1.);
  bool rightAboveWillFall = canFallDown(rigthAboveUv);
  if(rightAboveWillFall)
    return false;

  vec2 rightRightAboveUv = uv + pixelSize * vec2(2., 1.);
  bool rightRightAboveWillFallLeft = canFallToLeft(rightRightAboveUv);
  if(rightRightAboveWillFallLeft)
    return false;

  vec2 aboveUv = uv + pixelSize * vec2(0., 1.);
  bool above = isCellActive(aboveUv);
  if(above)
    return false;

  bool aboveWillFallRight = canFallToRight(aboveUv);
  if(aboveWillFallRight)
    return false;

  vec2 bellowUv = uv + pixelSize * vec2(0., -1.);
  if(bellowUv.y < 0.)
    return false;

  vec2 rightUv = uv + pixelSize * vec2(1., 0.);
  bool right = isCellActive(rightUv);
  if(right)
    return false;

  bool bellow = isCellActive(bellowUv);

  if(!bellow)
    return false;

  vec2 bellowRightUv = uv + pixelSize * vec2(1., -1.);
  bool bellowRight = isCellActive(bellowRightUv);
  float spaceBellowRightIsNotOutOfBounds = step(0.0, 1. - bellowRightUv.y);
  return bellowRight && spaceBellowRightIsNotOutOfBounds > 0.;
}

bool canSlideLeft(vec2 uv) {
  bool solid = isSolid(uv);
  if(solid)
    return false;
  bool state = isCellActive(uv);
  if(!state)
    return false;

  bool fallDown = canFallDown(uv);
  if(fallDown)
    return false;

  bool fallRight = canFallToRight(uv);
  if(fallRight)
    return false;

  bool fallLeft = canFallToLeft(uv);
  if(fallLeft)
    return false;

  bool slideRight = canSlideRight(uv);
  if(slideRight)
    return false;

  vec2 leftAboveUv = uv + pixelSize * vec2(-1., 1.);
  bool leftAboveWillFall = canFallDown(leftAboveUv);
  if(leftAboveWillFall)
    return false;

  vec2 leftLeftAboveUv = uv + pixelSize * vec2(-2., 1.);
  bool leftLeftAboveWillFallRight = canFallToRight(leftLeftAboveUv);
  if(leftLeftAboveWillFallRight)
    return false;

  vec2 aboveUv = uv + pixelSize * vec2(0., 1.);
  // bool above = isCellActive(aboveUv);
  // if(above)
  //   return false;

  bool aboveWillFallLeft = canFallToLeft(aboveUv);
  if(aboveWillFallLeft)
    return false;

  vec2 leftLeftUv = uv + pixelSize * vec2(-2., 0.);
  bool leftLeftWillSlideRight = canSlideRight(leftLeftUv);
  if(leftLeftWillSlideRight)
    return false;

  vec2 bellowUv = uv + pixelSize * vec2(0., -1.);
  if(bellowUv.y < 0.)
    return false;

  vec2 leftUv = uv + pixelSize * vec2(-1., 0.);
  bool left = isCellActive(leftUv);
  if(left)
    return false;

  bool bellow = isCellActive(bellowUv);

  if(!bellow)
    return false;

  vec2 bellowLeftUv = uv + pixelSize * vec2(-1., -1.);
  bool bellowLeft = isCellActive(bellowLeftUv);

  float spaceBellowLeftIsNotOutOfBounds = step(0.0, bellowLeftUv.y);
  return bellowLeft && spaceBellowLeftIsNotOutOfBounds > 0.;
}

vec4 sim() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  bool solid = isSolid(uv);
  if(solid) {
    return texture2D(textureSolid, uv);
  }
  vec4 prevState = texture2D(textureValue, uv);
  bool fallDown = canFallDown(uv);
  bool aboveFallDown = canFallDown(uv + pixelSize * vec2(0., 1.));
  bool fallRight = canFallToRight(uv);
  bool aboveLeftFallRight = canFallToRight(uv + pixelSize * vec2(-1., 1.));
  bool fallLeft = canFallToLeft(uv);
  bool aboveRightFallLeft = canFallToLeft(uv + pixelSize * vec2(1., 1.));

  bool slideRight = canSlideRight(uv);
  bool leftSlideRight = canSlideRight(uv + pixelSize * vec2(-1., 0.));
  bool slideLeft = canSlideLeft(uv);
  bool rightSlideLeft = canSlideLeft(uv + pixelSize * vec2(1., 0.));

  vec4 result = prevState;

  if(fallDown) {
    result = vec4(0.0, 0.0, 0.0, 0.0);
  }
  if(aboveFallDown) {
    result = texture2D(textureValue, uv + pixelSize * vec2(0., 1.));
  }
  if(fallRight) {
    result = vec4(0.0, 0.0, .0, 0.0);
  }
  if(aboveLeftFallRight) {
    result = texture2D(textureValue, uv + pixelSize * vec2(-1., 1.));
  }
  if(fallLeft) {
    result = vec4(0.0, 0.0, 0.0, 0.0);
  }
  if(aboveRightFallLeft) {
    result = texture2D(textureValue, uv + pixelSize * vec2(1., 1.));
  }
  // if(slideRight) {
  //   result = vec4(0.0, 0.0, 0.0, 0.0);
  // }
  // if(leftSlideRight) {
  //   result = texture2D(textureValue, uv + pixelSize * vec2(-1., 0.));
  // }
  if(slideLeft) {
    result = vec4(0.0, 0.0, 0.0, 0.0);
  }
  if(rightSlideLeft) {
    result = texture2D(textureValue, uv + pixelSize * vec2(1., 0.));
  }

  return result;

}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float c = 0.;

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
