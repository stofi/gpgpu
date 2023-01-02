#include 'common.glsl'

float px = 1.0 / resolution.x;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 current = texture2D(textureValue, uv);
  float r = resolution.x * radius / 1024.0;

  for(int i = 0; i < count; i++) {
    int xIndex = i % int(resolution.x);
    int yIndex = i / int(resolution.x);
    vec4 agent = texture2D(textureAgents, vec2(float(xIndex) / resolution.x, float(yIndex) / resolution.y)) / resolution.xyxy;
    float dis = length(agent.xy - uv);

    if(dis > (3. * r)) {
      continue;
    }

    vec3 color = getColor(i);
    bool center = dis < px * (2. * r);

    if(center) {
      gl_FragColor = vec4(color, 1.0);
      // gl_FragColor.rgb *= 3.;

      return;
    }

  }
  vec4 b = vec4(0.0);
  b = blur(uv, current);
  current = mix(current, b, 0.1);
  vec3 f = fadeFn(current.xyz);
  current = mix(current, vec4(f, 1.0), 0.1);
  float w = (current.r + current.g + current.b) / 3.0;
  // current.w = w;

  gl_FragColor = current;
}
