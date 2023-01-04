uniform float time;
uniform float noiseScale;
uniform float noiseScale2;
uniform float reverseVelocityMixFactor;
uniform float velocityThreshold;
uniform float smoothFactor;

#include "opensimplex.glsl"
#include "click.glsl"

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
    vec4 sim = openSimplex2SDerivatives_ImproveXY(vec3(uv * noiseScale, time / 100.));
    fluid.velocity.xy = sim.xy * noiseScale2;
  }
  fluid.velocity = mix(fluid.velocity, prev.velocity, reverseVelocityMixFactor);
  fluid.velocity = mix(fluid.velocity, next.velocity, 1. - reverseVelocityMixFactor);

  fluid.density = mix(fluid.density, prev.density, 1.);

  return fluid;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  Fluid oldState = sampleFluid(uv);
  Fluid newState = sim(uv);

  gl_FragColor.xy = mix(newState.velocity, oldState.velocity, smoothFactor);
  gl_FragColor.z = mix(newState.density, oldState.density, smoothFactor);
}
