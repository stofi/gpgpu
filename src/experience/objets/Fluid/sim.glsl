uniform float time;
uniform float noiseScale;
uniform float reverseVelocityMixFactor;
uniform float velocityThreshold;

#include "opensimplex.glsl"

struct Fluid {
  vec2 velocity; // in uv space
  float density;
};

Fluid sampleFluid(vec2 uv) {
  uv = fract(uv);
  vec4 prevState = texture2D(textureValue, uv);
  Fluid fluid;
  fluid.velocity = prevState.xy;
  fluid.density = prevState.z;
  return fluid;
}

Fluid sim(vec2 uv) {
  Fluid fluid = sampleFluid(uv);
  vec2 reverseVelocity = -fluid.velocity;
  Fluid prev = sampleFluid(uv + reverseVelocity);
  Fluid next = sampleFluid(uv + fluid.velocity);
  if(length(fluid.velocity) < velocityThreshold) {
    vec4 sim = openSimplex2SDerivatives_ImproveXY(vec3(uv * noiseScale, time));
    fluid.velocity.xy = sim.xy * 0.5;
  }
  fluid.velocity = mix(fluid.velocity, prev.velocity, reverseVelocityMixFactor);
  fluid.density = mix(fluid.density, prev.density, 1.);

  return fluid;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  Fluid newState = sim(uv);

  gl_FragColor.xy = newState.velocity;
  gl_FragColor.z = newState.density;
}
