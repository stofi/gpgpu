vec2 mapUvToUnit(vec2 uv) {
  vec2 origin = gl_FragCoord.xy / resolution.xy;
  vec2 offset = uv - origin;
  vec2 unitOffset = offset / pixelSize;
  return unitOffset;
}

vec2 mapUnitToUv(vec2 unit) {
  vec2 origin = gl_FragCoord.xy / resolution.xy;
  vec2 offset = unit * pixelSize;
  vec2 uv = origin + offset;
  return uv;
}

bool isSolid(vec2 uv) {
  vec4 state = texture2D(textureSolid, uv);
  return state.w > 0.01;
}

bool isCellActive(vec2 uv) {
  vec4 state = texture2D(textureValue, uv);
  return state.w > 0.01;
}

bool basicFallCheck(vec2 uv) {
  if(isSolid(uv))
    return false;
  if(!isCellActive(uv))
    return false;

  vec2 bellowUv = uv + pixelSize * vec2(0., -1.);

  if(bellowUv.y < 0.)
    return false;

  if(isCellActive(bellowUv))
    return false;

  if(isSolid(bellowUv))
    return false;

  return true;
}
bool basicFallCheckOffset(vec2 uv, vec2 offset) {
  if(isSolid(uv))
    return false;
  if(!isCellActive(uv))
    return false;

  vec2 offsetUv = uv + pixelSize * offset;
  if(offsetUv.x < 0. || offsetUv.x > 1.)
    return false;
  if(isCellActive(offsetUv))
    return false;

  if(isSolid(offsetUv))
    return false;

  vec2 bellowUv = uv + pixelSize * vec2(0., -1.);
  if(bellowUv.y < 0.)
    return false;

  vec2 bellowOffsetUv = uv + pixelSize * (offset + vec2(0., -1.));
  if(bellowOffsetUv.y < 0.)
    return false;

  if(isCellActive(bellowOffsetUv))
    return false;

  if(isSolid(bellowOffsetUv))
    return false;

  return true;
}

bool canFallDown(vec2 uv) {
  if(!basicFallCheck(uv))
    return false;

  return true;
}

bool slideOffsetCheck(vec2 uv, vec2 offset) {
  vec2 offsetUv = uv + pixelSize * offset;
  vec2 aboveUv = uv + pixelSize * vec2(0., 1.);
  vec2 aboveOffsetUv = uv + pixelSize * (offset + vec2(0., 1.));
  vec2 offset2Uv = uv + pixelSize * (offset * 2.);
  vec2 bellowUv = uv + pixelSize * vec2(0., -1.);
  vec2 bellowOffsetUv = uv + pixelSize * (offset + vec2(0., -1.));

    // Check if cell is out of bounds
  if(offsetUv.x < 0. || offsetUv.x > 1.) {
    return false;
  }

    // Check if cell is solid or active
  bool offsetSolid = isSolid(offsetUv);
  bool offsetActive = isCellActive(offsetUv);
  if(offsetSolid || offsetActive) {
    return false;
  }

    // Check if cell above is active and not solid
  bool aboveActive = isCellActive(aboveUv);
  bool aboveSolid = isSolid(aboveUv);
  if(aboveActive && !aboveSolid && aboveUv.y < 1.) {
    return false;
  }

    // Check if cell above offset is active and not solid
  bool aboveOffsetActive = isCellActive(aboveOffsetUv);
  bool aboveOffsetSolid = isSolid(aboveOffsetUv);
  if(aboveOffsetActive && !aboveOffsetSolid) {
    return false;
  }

    // Check if cell 2 offset is active and not solid
  bool offset2Active = isCellActive(offset2Uv);
  bool offset2Solid = isSolid(offset2Uv);
  if(offset2Active && !offset2Solid && offset2Uv.x > 0. && offset2Uv.x < 1.) {
    return false;
  }

    // Check if cells bellow are both solid or active
  bool bellowSolidOrActive = isSolid(bellowUv) || isCellActive(bellowUv);
  bool bellowOffsetSolidOrActive = isSolid(bellowOffsetUv) || isCellActive(bellowOffsetUv);
  bool bothBellowSolidOrActive = bellowSolidOrActive || bellowOffsetSolidOrActive;
  bool bellowOutOfBounds = bellowUv.y < 0.;

  bool bellowCondition = bellowOutOfBounds || bothBellowSolidOrActive;

  if(!bellowCondition)
    return false;

  return true;
}

bool canFallToOffset(vec2 uv, vec2 offset) {
  return !canFallDown(uv) && basicFallCheckOffset(uv, offset);
}

bool canSlideRightFirst(vec2 uv) {
  return !canFallDown(uv) && slideOffsetCheck(uv, vec2(1., 0.));
}

bool canSlideLeftFirst(vec2 uv) {
  return !canFallDown(uv) && slideOffsetCheck(uv, vec2(-1., 0.));
}
bool canSlideRight(vec2 uv) {
  return !(canFallDown(uv) || canSlideLeftFirst(uv) || canSlideLeftFirst(uv + pixelSize * vec2(2., 0.)) || !slideOffsetCheck(uv, vec2(1., 0.)));
}

bool canSlideLeft(vec2 uv) {
  if(canFallDown(uv) || canSlideRightFirst(uv) || canSlideRightFirst(uv + pixelSize * vec2(-2., 0.)))
    return false;

  return slideOffsetCheck(uv, vec2(-1., 0.));
}

bool canFallToRight(vec2 uv) {
  return !canSlideRight(uv) && !canSlideLeft(uv) && canFallToOffset(uv, vec2(1., 0.));
}

bool canFallToLeft(vec2 uv) {
  return (!canSlideRight(uv) && !canSlideLeft(uv) && !canFallToRight(uv) && canFallToOffset(uv, vec2(-1., 0.)));
}
