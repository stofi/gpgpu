uniform int tick;

bool isSolid(vec2 uv) {
  vec4 state = texture2D(textureSolid, uv);
  return state.w > 0.01;
}

bool isCellActive(vec2 uv) {
  vec4 state = texture2D(textureValue, uv);
  return state.w > 0.01;
}

bool basicFallCheck(vec2 uv) {
  // If this cell is solid, it can't fall
  if(isSolid(uv))
    return false;
  // If this cell is not active, it can't fall
  if(!isCellActive(uv))
    return false;

  // vec2 aboveUv = uv + pixelSize * vec2(0., 1.);
  // bool aboveOutOfBounds = aboveUv.y > 1.;
  // if(isCellActive(aboveUv) && !isSolid(aboveUv) && !aboveOutOfBounds)
  //   return false;

  vec2 bellowUv = uv + pixelSize * vec2(0., -1.);

  // If the cell below is out of bounds, it can't fall
  if(bellowUv.y < 0.)
    return false;

  // If the cell below is active, it can't fall
  if(isCellActive(bellowUv))
    return false;

  // If the cell below is solid, it can't fall
  if(isSolid(bellowUv))
    return false;

  return true;
}
bool basicFallCheckOffset(vec2 uv, vec2 offset) {
  // If this cell is solid, it can't fall
  if(isSolid(uv))
    return false;
  // If this cell is not active, it can't fall
  if(!isCellActive(uv))
    return false;

  // vec2 aboveUv = uv + pixelSize * vec2(0., 1.);
  // bool aboveOutOfBounds = aboveUv.y > 1.;
  // if(isCellActive(aboveUv) && !isSolid(aboveUv) && !aboveOutOfBounds)
  //   return false;

  vec2 offsetUv = uv + pixelSize * offset;
  // if offsetUv is out of bounds, it can't fall
  if(offsetUv.x < 0. || offsetUv.x > 1.)
    return false;
  // If the cell at the offset is active, it can't fall
  if(isCellActive(offsetUv))
    return false;

  // If the cell at the offset is solid, it can't fall
  if(isSolid(offsetUv))
    return false;

  vec2 bellowUv = uv + pixelSize * vec2(0., -1.);
  if(bellowUv.y < 0.)
    return false;

  vec2 bellowOffsetUv = uv + pixelSize * (offset + vec2(0., -1.));
  if(bellowOffsetUv.y < 0.)
    return false;

  // If cell below offset is active, it can't fall
  if(isCellActive(bellowOffsetUv))
    return false;

  // If cell below offset is solid, it can't fall
  if(isSolid(bellowOffsetUv))
    return false;

  return true;
}

bool canFallDown(vec2 uv) {
  if(!basicFallCheck(uv))
    return false;

  return true;
}

bool canFallToOffset(vec2 uv, vec2 offset) {
  if(canFallDown(uv))
    return false;

  if(!basicFallCheckOffset(uv, offset))
    return false;

  return true;
}
bool canFallToRight(vec2 uv) {
  return canFallToOffset(uv, vec2(1., 0.));
}

bool canFallToLeft(vec2 uv) {
  if(canFallToRight(uv))
    return false;

  return canFallToOffset(uv, vec2(-1., 0.));
}

bool slideOffsetCheck(vec2 uv, vec2 offset) {
  // If this cell is solid, it can't slide
  if(isSolid(uv))
    return false;
  // If this cell is not active, it can't slide
  if(!isCellActive(uv))
    return false;

  vec2 offsetUv = uv + pixelSize * offset;
  // if offsetUv is out of bounds, it can't slide
  if(offsetUv.x < 0. || offsetUv.x > 1.)
    return false;

  // If the cell at the offset is solid, it can't slide
  if(isSolid(offsetUv))
    return false;

  // If the cell at the offset is active, it can't slide
  if(isCellActive(offsetUv))
    return false;

  vec2 aboveUv = uv + pixelSize * vec2(0., 1.);
  // if cellAbove is active, not solid and not out of bounds, it can't slide
  if(isCellActive(aboveUv) && !isSolid(aboveUv) && aboveUv.y < 1.)
    return false;

  vec2 aboveOffsetUv = uv + pixelSize * (offset + vec2(0., 1.));
  // if cellAboveOffset is active, it can't slide
  if(isCellActive(aboveOffsetUv) && !isSolid(aboveOffsetUv))
    return false;

  vec2 offset2Uv = uv + pixelSize * (offset * 2.);
  // if cellOffset2 is active, not solid and not out of bounds, it can't slide
  if(isCellActive(offset2Uv) && !isSolid(offset2Uv) && offset2Uv.x > 0. && offset2Uv.x < 1.)
    return false;

  /* 
    We need to check if the cell plus offset * 2 + vec2(0., 1.), we will cal it aboveOffset2 will fall to the offset cell.
    If it will, we can't slide. 
    If the cell aboveOffset2 is solid, or out of bounds we can slide.
  */
  vec2 aboveOffset2Uv = uv + pixelSize * (offset * 2. + vec2(0., 1.));
  bool aboveOffset2OutOfBounds = aboveOffset2Uv.y > 1. || aboveOffset2Uv.x < 0. || aboveOffset2Uv.x > 1.;
  vec2 reverseOffset = vec2(-offset.x, offset.y);
  bool aboveOffset2Solid = isSolid(aboveOffset2Uv);
  bool aboveOffset2Active = isCellActive(aboveOffset2Uv);
  bool aboveOffset2Condition = !(aboveOffset2OutOfBounds || aboveOffset2Solid && !aboveOffset2Active);
  if(aboveOffset2Condition && canFallToOffset(uv, reverseOffset))
    return false;

  vec2 bellowUv = uv + pixelSize * vec2(0., -1.);
  vec2 bellowOffsetUv = uv + pixelSize * (offset + vec2(0., -1.));

  // both the cells below and below the offset must be either solid, active, or out of bounds for sliding to be possible

  bool bellowSolidOrActive = isSolid(bellowUv) || isCellActive(bellowUv);
  bool bellowOffsetSolidOrActive = isSolid(bellowOffsetUv) || isCellActive(bellowOffsetUv);
  bool bothBellowSolidOrActive = bellowSolidOrActive && bellowOffsetSolidOrActive;

  bool bellowOutOfBounds = bellowUv.y < 0.;

  bool bellowCondition = bellowOutOfBounds || bothBellowSolidOrActive;

  if(!bellowCondition)
    return false;

  return true;

}

bool canSlideRightFirst(vec2 uv) {
  if(canFallDown(uv))
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
  if(canFallDown(uv))
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
  if(canFallDown(uv))
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
  if(canFallDown(uv))
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
