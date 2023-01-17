uniform float time;
uniform float noiseScale;
uniform float noiseScale2;
uniform float reverseVelocityMixFactor;
uniform float velocityThreshold;
uniform float smoothFactor;
uniform bool brushColorRandom;
uniform vec3 brushColor;
#include "click.glsl"

const int mask = 2;

const vec2 pixelSize = vec2(1.) / resolution.xy;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float c = 0.;
  bool isClicked = isInMask(mask);
  if(isClicked) {
    c = handleClick(uv);
  }
  vec4 brush = vec4(brushColor, 1.);

  if(isInMask(3)) {
    brush = vec4(0.);
    c = handleClick(uv);
  }

  vec4 state = texture2D(textureSolid, uv);
  gl_FragColor = state;
  gl_FragColor = mix(gl_FragColor, brush, c);
}
