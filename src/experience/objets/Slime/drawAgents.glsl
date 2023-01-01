#include 'common.glsl'

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 current = texture2D(textureValue, uv);
  float px = 1.0 / resolution.x;

  for(int i = 0; i < count; i++) {
  // calculate the x and y indices for the agent position
    int xIndex = i % int(resolution.x);
    int yIndex = i / int(resolution.x);
    vec2 agentPos = texture2D(textureAgents, vec2(float(xIndex) / resolution.x, float(yIndex) / resolution.y)).xy /
      resolution.xy;
    vec3 color = getColor(i);
    if(distance(uv, agentPos) < px * (resolution.x * radius / 1024.)) {
      gl_FragColor = vec4(color, 1.0);
      return;
    }
  }

  vec4 b = vec4(0.0);
  // blur(uv, current);
  b.r = blurChannel(uv, current, vec4(1.0, 0.0, 0.0, 0.0)).r;
  b.g = blurChannel(uv, current, vec4(0.0, 1.0, 0.0, 0.0)).g;
  b.b = blurChannel(uv, current, vec4(0.0, 0.0, 1.0, 0.0)).b;

  current = mix(current, b, 0.1);
  current.xyz = fadeFn(current.xyz);
  gl_FragColor = current;
}
