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

vec2 steer(vec4 agent) {

  vec2 uv = gl_FragCoord.xy / resolution.xy;
  bool isRedGroup = uv.x  < 1.0 / 3.0;
  bool isGreenGroup = uv.x  < 2.0 / 3.0;
  bool isBlueGroup = !isRedGroup && !isGreenGroup;

  vec3 color = vec3(0.0);
  if(isRedGroup) {
    color =   redColor;


  } else if(isGreenGroup) {
    color = greenColor;

  } else if(isBlueGroup) {
    color = blueColor;

  }

  vec2 agentPos = agent.xy / resolution.xy;
  vec2 agentVel = sampleDistance * agent.zw / resolution.xy;

  float angle = 3.14159 / sampleSpread;
  vec2 left = rotate(agentVel, angle);
  vec2 right = rotate(agentVel, -angle);
  vec2 center = agentVel;

  float leftWeight = 0.;
  float rightWeight = 0.;
  float centerWeight = 0.;

  // sample the texture at the left, right and center positions

  bool leftInBounds = agentPos.x + left.x > 0.0 && agentPos.x + left.x < 1.0 && agentPos.y + left.y > 0.0 && agentPos.y + left.y < 1.0;
  bool rightInBounds = agentPos.x + right.x > 0.0 && agentPos.x + right.x < 1.0 && agentPos.y + right.y > 0.0 && agentPos.y + right.y < 1.0;
  bool centerInBounds = agentPos.x + center.x > 0.0 && agentPos.x + center.x < 1.0 && agentPos.y + center.y > 0.0 && agentPos.y + center.y < 1.0;

  if(leftInBounds) {
    vec4 s = texture2D(textureValue, agentPos + left);
    leftWeight = length(s.xyz * color);
  }
  if(rightInBounds) {
    vec4 s = texture2D(textureValue, agentPos + right);
    rightWeight = length(s.xyz * color);
  }
  if(centerInBounds) {
    vec4 s = texture2D(textureValue, agentPos + center);
    centerWeight = length(s.xyz * color);
  }

  // update the velocity based on the weights
  if(leftWeight > centerWeight && leftWeight > rightWeight) {
    agentVel = left;
  } else if(rightWeight > centerWeight && rightWeight > leftWeight) {
    agentVel = right;
  } else {
    agentVel = center;
  }

  if(!leftInBounds && !rightInBounds && !centerInBounds) {
    agentVel = -agentVel;
  } 
  // normalize the velocity
  agentVel = normalize(agentVel);
  vec2 current = agent.zw / resolution.xy;
  // if new velocity is almost zero, keep the old one

  if(length(agentVel) < 0.01) {
    agentVel = current;
  }

  agent.zw = agentVel * resolution.xy;

  return agentVel;
}

vec4 updateAgent(vec4 agent) {
  vec2 agentPos = agent.xy;
  vec2 agentVel = agent.zw;

  // steer the agent
  agentVel = steer(agent);

  // rotate velocity by a random amount
  float angle = noise3(vec3(agentPos + vec2(delta, 1.), time)) * 2.0 - 1.0;
  agentVel = rotate(agentVel, angle * randomness);

  agentPos += agentVel * delta * 0.1 * speed;

  agentPos = mod(agentPos + resolution.xy, resolution.xy);

  agent.xy = agentPos;
  agent.zw = agentVel;

  return agent;
}

void main() {

  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 agent = texture2D(textureAgents, uv);

  agent = updateAgent(agent);

  gl_FragColor = agent;
  // gl_FragColor = texture2D( textureAgents, uv );

}

