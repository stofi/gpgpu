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
