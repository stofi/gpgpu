#include 'common.glsl'

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 current = texture2D(textureValue, uv);
  float px = 1.0 / resolution.x;

  for(int i = 0; i < count; i++) {
    vec2 agentPos = texture2D(textureAgents, vec2(float(i) / float(count), 0.0)).xy /
      resolution.xy;
    vec3 color = getColor(i);
    if(distance(uv, agentPos) < px * radius) {
      gl_FragColor = vec4(color, 1.0);
      return;
    }
  }

  vec4 b = blur(uv, current);
  current = mix(current, b, 0.1);
  current.xyz = fadeFn(current.xyz);
  gl_FragColor = current;
}
