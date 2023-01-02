#include 'noise.glsl'
#include 'common.glsl'

vec2 checkBounds(vec2 agentPos, vec2 agentVel) {
  vec2 newPos = agentPos + agentVel;

  if(newPos.x < 0.0 || newPos.x > 1.0 || newPos.y < 0.0 || newPos.y > 1.0) {
    agentVel = rotate(agentVel, 3.14159 / 2.0);
    agentVel = normalize(agentVel) * 2.0;
  }

  return agentVel;
}

float calcWeight(vec2 uv, vec3 color, vec2 pos) {
  vec2 check = boundsCheck(pos);
  vec3 s = texture2D(textureValue, check).xyz;

  if(check.x == -1.0)
    return 0.0;

  if(color.r > color.g && color.r > color.b) {
    return s.r - (s.g + s.b) / 2.0;
  } else if(color.g > color.r && color.g > color.b) {
    return s.g - (s.r + s.b) / 2.0;
  } else if(color.b > color.r && color.b > color.g) {
    return s.b - (s.r + s.g) / 2.0;
  } else {
    return length(s);
  }
}

vec2 getVelocity(vec2 uv, vec3 color, vec2 agentPos, vec2 agentVel) {
  float angle = 3.14159 / sampleSpread;
  vec2 left = rotate(agentVel, angle);
  vec2 right = rotate(agentVel, -angle);
  vec2 center = agentVel;

  float leftWeight = calcWeight(uv, color, agentPos + left);
  float rightWeight = calcWeight(uv, color, agentPos + right);
  float centerWeight = calcWeight(uv, color, agentPos + center);

  return (leftWeight > centerWeight && leftWeight > rightWeight) ? left : (rightWeight > centerWeight && rightWeight > leftWeight) ? right : center;
}

vec2 steer(vec4 agent) {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 color = getColor(uv);
  vec2 agentPos = agent.xy / resolution.xy;
  vec2 agentVel = (resolution.x * sampleDistance / 1024.) * agent.zw / resolution.xy;

  agentVel = checkBounds(agentPos, agentVel);
  agentVel = getVelocity(uv, color, agentPos, agentVel);

  agentVel = (length(agentVel) < 0.01) ? agent.zw / resolution.xy : normalize(agentVel);
  agent.zw = agentVel * resolution.xy;

  return agentVel;
}

vec4 updateAgent(vec4 agent) {

  agent.zw = rotate(agent.zw, (noise3(vec3(420. * gl_FragCoord.xy, time)) * 2.0 - 1.0) *
    randomness);

  agent.zw = steer(agent);
  agent.xy += agent.zw * delta * 0.1 * (resolution.x * speed / 1024.);

  return vec4(agent.xy, agent.zw);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 agent = texture2D(textureAgents, uv);
  // agent = updateAgent(agent);
  // interpolate between the current agent and the new agent
  agent = mix(agent, updateAgent(agent), stepInterpolation);

  agent.xy = mod(agent.xy + resolution.xy, resolution.xy);

  gl_FragColor = agent;
}
