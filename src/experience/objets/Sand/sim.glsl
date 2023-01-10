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
uniform int tick;
#include "opensimplex.glsl"
#include "click.glsl"

const vec2 pixelSize = vec2(1.) / resolution.xy;

const int mask = 1;

float getNoise(vec2 uv) {
  vec4 n = openSimplex2SDerivativesPart(vec3(uv * resolution.xy, time));
  return (n.x + n.y + n.z + n.w) / 4.;
}

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

bool basicFallCheck(vec2 uv) {
  if(isSolid(uv))
    return false;
  if(!isCellActive(uv))
    return false;

  if(canFallDown(uv))
    return false;

  vec2 aboveUv = uv + pixelSize * vec2(0., 1.);
  bool aboveOutOfBounds = aboveUv.y > 1.;
  if(isCellActive(aboveUv) && !isSolid(aboveUv) && !aboveOutOfBounds)
    return false;

  vec2 bellowUv = uv + pixelSize * vec2(0., -1.);
  if(bellowUv.y < 0.)
    return false;

  if(!isCellActive(bellowUv))
    return false;

  return true;
}
bool offsetFallCheck(vec2 uv, vec2 offset) {
  vec2 offsetUv = uv + pixelSize * offset;

  // check if offset is occupied
  if(isCellActive(offsetUv))
    return false;

  // check if below offset is occupied and return false if it is
  vec2 bellowOffsetUv = uv + pixelSize * (offset + vec2(0., -1.));
  if(isCellActive(bellowOffsetUv))
    return false;

  // check if below offset is out of bounds
  // calculate x for step function
  float x = (offset.x > 0. ? 1. - bellowOffsetUv.y : bellowOffsetUv.y);
  // check if below offset is out of bounds
  float spaceBellowOffsetIsNotOutOfBounds = step(0.0, x);

  // if offset is not occupied and below offset is not occupied and below offset is not out of bounds
  // then return true
  return spaceBellowOffsetIsNotOutOfBounds > 0.;
}

bool canFallToRight(vec2 uv) {
  bool switchMove = tick % 2 == 0;
  if(!switchMove)
    return false;

  if(!basicFallCheck(uv))
    return false;

  if(!offsetFallCheck(uv, vec2(1., 0.)))
    return false;

  return true;
}

bool canFallToLeft(vec2 uv) {
  bool switchMove = tick % 2 == 0;
  if(!switchMove)
    return false;
  if(!basicFallCheck(uv))
    return false;

  if(canFallToRight(uv))
    return false;

  if(!offsetFallCheck(uv, vec2(-1., 0.)))
    return false;

  return true;
}

bool slideOffsetCheck(vec2 uv, vec2 offset) {
  if(!offsetFallCheck(uv + offset, offset))
    return false;
  vec2 offsetUv = uv + pixelSize * offset;
  if(isCellActive(offsetUv))
    return false;

  vec2 offsetAboveUv = uv + pixelSize * (offset + vec2(0., 1.));
  if(canFallDown(offsetAboveUv) && !isSolid(offsetAboveUv))
    return false;

  vec2 offsetOffsetAboveUv = uv + pixelSize * (offset * 2.);
  if(offset.x > 0. && canFallToRight(offsetOffsetAboveUv))
    return false;
  if(offset.x < 0. && canFallToLeft(offsetOffsetAboveUv))
    return false;

  vec2 aboveUv = uv + pixelSize * vec2(0., 1.);
  if(offset.x < 0. && canFallToRight(aboveUv))
    return false;

  if(offset.x > 0. && canFallToLeft(aboveUv))
    return false;

  return true;

}

bool canSlideRightFirst(vec2 uv) {
  bool switchMove = tick % 2 == 0;
  if(switchMove)
    return false;
  if(!basicFallCheck(uv))
    return false;

  if(canFallToRight(uv))
    return false;

  if(canFallToLeft(uv))
    return false;

  if(!slideOffsetCheck(uv, vec2(1., 0.)))
    return false;

  return true;

}

bool canSlideLeftFirst(vec2 uv) {
  bool switchMove = tick % 2 == 0;
  if(switchMove)
    return false;
  if(!basicFallCheck(uv))
    return false;

  if(canFallToRight(uv))
    return false;

  if(canFallToLeft(uv))
    return false;

  if(!slideOffsetCheck(uv, vec2(-1., 0.)))
    return false;

  return true;
}

bool canSlideRight(vec2 uv) {
  bool switchMove = tick % 2 == 0;
  if(switchMove)
    return false;
  if(!basicFallCheck(uv))
    return false;

  if(canFallToRight(uv))
    return false;

  if(canFallToLeft(uv))
    return false;

  if(canSlideLeftFirst(uv))
    return false;

  vec2 rightRightUv = uv + pixelSize * vec2(2., 0.);
  if(canSlideLeftFirst(rightRightUv))
    return false;

  if(!slideOffsetCheck(uv, vec2(1., 0.)))
    return false;

  return true;
}

bool canSlideLeft(vec2 uv) {
  bool switchMove = tick % 2 == 0;
  if(switchMove)
    return false;
  if(!basicFallCheck(uv))
    return false;

  if(canFallToRight(uv))
    return false;

  if(canFallToLeft(uv))
    return false;

  if(canSlideRightFirst(uv))
    return false;

  vec2 leftLeftUv = uv + pixelSize * vec2(-2., 0.);
  if(canSlideRightFirst(leftLeftUv))
    return false;

  if(!slideOffsetCheck(uv, vec2(-1., 0.)))
    return false;

  return true;
}

bool willMove(vec2 uv) {
  bool slideRight = false;
  if(canFallDown(uv) || (enableDiagonal && (canFallToRight(uv) || canFallToLeft(uv)))) {
    return true;
  }
  if(enableSlide && slideRight && (canSlideRightFirst(uv) || canSlideLeft(uv))) {
    return true;
  } else if(enableSlide && !slideRight && (canSlideLeftFirst(uv) || canSlideRight(uv))) {
    return true;
  }

  return false;
}
vec4 cellToMoveInto(vec2 uv) {
  bool slideRight = false;
  bool switchMove = tick % 2 == 0;
  vec4 result = vec4(0.0, 0.0, 0.0, 0.0);
  vec2 aboveUv = uv + pixelSize * vec2(0., 1.);
  vec2 leftUv = uv + pixelSize * vec2(-1., 0.);
  vec2 rightUv = uv + pixelSize * vec2(1., 0.);
  vec2 leftAboveUv = uv + pixelSize * vec2(-1., 1.);
  vec2 rightAboveUv = uv + pixelSize * vec2(1., 1.);
  if(aboveUv.y > 1.)
    return result;
  if(canFallDown(aboveUv)) {
    result = texture2D(textureValue, uv + pixelSize * vec2(0., 1.));
  }
  if(enableDiagonal && switchMove) {
    if(canFallToRight(leftAboveUv)) {
      result = texture2D(textureValue, uv + pixelSize * vec2(-1., 1.));
    }
    if(canFallToLeft(rightAboveUv)) {
      result = texture2D(textureValue, uv + pixelSize * vec2(1., 1.));
    }
  }
  if(enableSlide && slideRight && !switchMove) {
    if(canSlideRightFirst(leftUv)) {
      result = texture2D(textureValue, uv + pixelSize * vec2(-1., 0.));
    }
    if(canSlideLeft(rightUv)) {
      result = texture2D(textureValue, uv + pixelSize * vec2(1., 0.));
    }
  } else if(enableSlide && !slideRight && !switchMove) {
    if(canSlideLeftFirst(rightUv)) {
      result = texture2D(textureValue, uv + pixelSize * vec2(1., 0.));
    }
    if(canSlideRight(leftUv)) {
      result = texture2D(textureValue, uv + pixelSize * vec2(-1., 0.));
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
