uniform float time;
uniform float delta;
uniform int count;
uniform float fade;
uniform vec3 redColor;
uniform vec3 greenColor;
uniform vec3 blueColor;

const int NUM_DIRECTIONS = 8;
vec2 directions[NUM_DIRECTIONS] = vec2[](vec2(0.0, 1.0 / resolution.y), vec2(0.0, -1.0 / resolution.y), vec2(1.0 / resolution.x, 0.0), vec2(-1.0 / resolution.x, 0.0), vec2(1.0 / resolution.x, 1.0 / resolution.y), vec2(-1.0 / resolution.x, 1.0 / resolution.y), vec2(1.0 / resolution.x, -1.0 / resolution.y), vec2(-1.0 / resolution.x, -1.0 / resolution.y));

vec4 blur(vec2 uv, vec4 color) {
  // vec4 sum = color;
  vec4 sum = vec4(0.0);
  for(int i = 0; i < NUM_DIRECTIONS; i++) {
    sum += texture2D(textureValue, uv + directions[i]);
  }
  return sum / float(NUM_DIRECTIONS + 0);
}

void main() {

  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec4 current = texture2D(textureValue, uv);
  float px = 1.0 / resolution.x;
  // step through all agents
  for(int i = 0; i < count; i++) {
    // get the position of the agent
    vec2 agentPos = texture2D(textureAgents, vec2(float(i) / float(count), 0.0)).xy;
    // convert the ageny position to a 0.0 - 1.0 range
    agentPos = agentPos / resolution.xy;

    bool isRedGroup = i < count / 3;
    bool isGreenGroup = i < count * 2 / 3;
    bool isBlueGroup = !isRedGroup && !isGreenGroup;

    vec3 color = vec3(0.0);
    if(isRedGroup) {
      color = redColor;
    } else if(isGreenGroup) {
      color = greenColor;
    } else if(isBlueGroup) {
      color = blueColor;
    }

    // calculate the distance to the agent
    float dist = distance(uv, agentPos);
    // if the distance is less than 0.01, we have a hit
    if(dist < px * 2.0) {
      // set the value to 1.0
      gl_FragColor = vec4(color, 1.0);
      return;
    }

  }
  current = blur(uv, current);
  current.xyz = mix(current.xyz, vec3(0.0), fade);

  gl_FragColor = current;

  // for 

}
