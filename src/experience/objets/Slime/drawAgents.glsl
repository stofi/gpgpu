#include 'common.glsl'

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 current = texture2D(textureValue, uv);
  float px = 1.0 / resolution.x;

  for(int i = 0; i < count; i++) {
  // calculate the x and y indices for the agent position
    int xIndex = i % int(resolution.x);
    int yIndex = i / int(resolution.x);
    vec4 agent = texture2D(textureAgents, vec2(float(xIndex) / resolution.x, float(yIndex) / resolution.y));
    vec2 agentPos = agent.xy / resolution.xy;
    vec2 agentVel = agent.zw / resolution.xy;
    vec2 offset = agentPos - agentVel;
    vec3 color = getColor(i);
    bool center = distance(uv, agentPos) < px * (2. * resolution.x * radius / 1024.);
    bool edge = distance(uv, offset) < px * (1. * resolution.x * radius / 1024.);

    if(center && !edge) {
      gl_FragColor = vec4(color, 1.0);
      return;
    }
    if(edge) {
      gl_FragColor = vec4(1.);
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
  current.w = (current.x + current.y + current.z) / 3.;
  gl_FragColor = current;
}
