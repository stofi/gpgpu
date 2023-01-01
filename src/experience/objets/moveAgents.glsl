uniform float time;
uniform float delta;
uniform int count;
uniform float sampleDistance;
uniform float sampleSpread;
uniform float speed;
uniform float randomness;
uniform vec3 redColor;
uniform vec3 greenColor;
uniform vec3 blueColor;

// 2D Random
float random(in vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise(in vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

    // Four corners in 2D of a tile
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
  vec2 u = f * f * (3.0 - 2.0 * f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
  return mix(a, b, u.x) +
    (c - a) * u.y * (1.0 - u.x) +
    (d - b) * u.x * u.y;
}

float noise3(in vec3 st) {
  vec2 i = floor(st.xy);
  vec2 f = fract(st.xy);

    // Four corners in 2D of a tile
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
  vec2 u = f * f * (3.0 - 2.0 * f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
  return mix(a, b, u.x) +
    (c - a) * u.y * (1.0 - u.x) +
    (d - b) * u.x * u.y;
}

vec2 rotate(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  mat2 m = mat2(c, -s, s, c);
  return m * v;
}

vec2 boundsCheck(vec2 pos) {
  return (pos.x > 0.0 && pos.x < 1.0 && pos.y > 0.0 && pos.y < 1.0) ? pos : vec2(-1.0);
}

vec3 getColor(vec2 uv) {
  bool isRedGroup = uv.x < 1.0 / 3.0;
  bool isGreenGroup = uv.x < 2.0 / 3.0;
  bool isBlueGroup = !isRedGroup && !isGreenGroup;
  return (isRedGroup) ? redColor : (isGreenGroup) ? greenColor : blueColor;
}

vec2 steer(vec4 agent) {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 color = getColor(uv);
  vec2 agentPos = agent.xy / resolution.xy;
  vec2 agentVel = (resolution.x * sampleDistance /1024.) * agent.zw / resolution.xy;

  float angle = 3.14159 / sampleSpread;
  vec2 left = rotate(agentVel, angle);
  vec2 right = rotate(agentVel, -angle);
  vec2 center = agentVel;

  vec2 leftCheck = boundsCheck(agentPos + left);
  vec2 rightCheck = boundsCheck(agentPos + right);
  vec2 centerCheck = boundsCheck(agentPos + center);

  float leftWeight = (leftCheck.x != -1.0) ? length((texture2D(textureValue, leftCheck).xyz * color)) : 0.0;
  float rightWeight = (rightCheck.x != -1.0) ? length((texture2D(textureValue, rightCheck).xyz * color)) : 0.0;
  float centerWeight = (centerCheck.x != -1.0) ? length((texture2D(textureValue, centerCheck).xyz * color)) : 0.0;

  // update the velocity based on the weights
  if(leftWeight > centerWeight && leftWeight > rightWeight) {
    agentVel = left;
  } else if(rightWeight > centerWeight && rightWeight > leftWeight) {
    agentVel = right;
  } else {
    agentVel = center;
  }

  agentVel = (leftWeight > centerWeight && leftWeight > rightWeight) ? left : (rightWeight > centerWeight && rightWeight > leftWeight) ? right : center;

  agentVel = (length(agentVel) < 0.01) ? agent.zw / resolution.xy : normalize(agentVel);
  agent.zw = agentVel * resolution.xy;

  return agentVel;
}

vec4 updateAgent(vec4 agent) {
  vec2 agentPos = agent.xy;
  vec2 agentVel = agent.zw;

  agentVel = steer(agent);
  agentVel = rotate(agentVel, (noise3(vec3(agentPos + vec2(delta, 1.), time)) * 2.0 - 1.0) * randomness);
  agentPos += agentVel * delta * 0.1 * (resolution.x*speed/1024.);
  agentPos = mod(agentPos + resolution.xy, resolution.xy);

  return vec4(agentPos, agentVel);
}


void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 agent = texture2D(textureAgents, uv);
  agent = updateAgent(agent);
  gl_FragColor = agent;
}
