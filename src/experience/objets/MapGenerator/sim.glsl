#include "simplex.glsl"
uniform float time;
const vec2 pixelSize = vec2(1.) / resolution.xy;
#include "common.glsl"

const int mask = 1;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float c = 0.;

  gl_FragColor = texture2D(textureValue, uv);

  vec4 result = gl_FragColor;

  vec3 noisePos = vec3(uv.x, uv.y, time);
  noisePos.xy *= 20.;
  noisePos.z *= 0.001;

  float noise = snoise(noisePos);
  // result.r = noise;
  if(noise > .5) {
    gl_FragColor = result;
    return;
  }

  vec4 up = texture2D(textureValue, uv + vec2(0., pixelSize.y));
  vec4 down = texture2D(textureValue, uv - vec2(0., pixelSize.y));
  vec4 left = texture2D(textureValue, uv - vec2(pixelSize.x, 0.));
  vec4 right = texture2D(textureValue, uv + vec2(pixelSize.x, 0.));

  vec4 upLeft = texture2D(textureValue, uv + vec2(-pixelSize.x, pixelSize.y));
  vec4 upRight = texture2D(textureValue, uv + vec2(pixelSize.x, pixelSize.y));
  vec4 downLeft = texture2D(textureValue, uv + vec2(-pixelSize.x, -pixelSize.y));
  vec4 downRight = texture2D(textureValue, uv + vec2(pixelSize.x, -pixelSize.y));

  vec4 up2 = texture2D(textureValue, uv + vec2(0., pixelSize.y * 2.));
  vec4 down2 = texture2D(textureValue, uv - vec2(0., pixelSize.y * 2.));
  vec4 left2 = texture2D(textureValue, uv - vec2(pixelSize.x * 2., 0.));
  vec4 right2 = texture2D(textureValue, uv + vec2(pixelSize.x * 2., 0.));

  vec4 up3 = texture2D(textureValue, uv + vec2(0., pixelSize.y * 3.));
  vec4 down3 = texture2D(textureValue, uv - vec2(0., pixelSize.y * 3.));
  vec4 left3 = texture2D(textureValue, uv - vec2(pixelSize.x * 3., 0.));
  vec4 right3 = texture2D(textureValue, uv + vec2(pixelSize.x * 3., 0.));

  bool upWhite = up.a > .1;
  bool downWhite = down.a > .1;
  bool leftWhite = left.a > .1;
  bool rightWhite = right.a > .1;

  bool upLeftWhite = upLeft.a > .1;
  bool upRightWhite = upRight.a > .1;
  bool downLeftWhite = downLeft.a > .1;
  bool downRightWhite = downRight.a > .1;

  bool up2White = up2.a > .1;
  bool down2White = down2.a > .1;
  bool left2White = left2.a > .1;
  bool right2White = right2.a > .1;

  bool up3White = up3.a > .1;
  bool down3White = down3.a > .1;
  bool left3White = left3.a > .1;
  bool right3White = right3.a > .1;

  bool upBlack = up.a < .9;
  bool downBlack = down.a < .9;
  bool leftBlack = left.a < .9;
  bool rightBlack = right.a < .9;

  bool upLeftBlack = upLeft.a < .9;
  bool upRightBlack = upRight.a < .9;
  bool downLeftBlack = downLeft.a < .9;
  bool downRightBlack = downRight.a < .9;

  bool up2Black = up2.a < .9;
  bool down2Black = down2.a < .9;
  bool left2Black = left2.a < .9;
  bool right2Black = right2.a < .9;

  bool up3Black = up3.a < .9;
  bool down3Black = down3.a < .9;
  bool left3Black = left3.a < .9;
  bool right3Black = right3.a < .9;

  bool upAndUp2White = upWhite && up2White && up3White;
  bool downAndDown2White = downWhite && down2White && down3White;
  bool leftAndLeft2White = leftWhite && left2White && left3White;
  bool rightAndRight2White = rightWhite && right2White && right3White;

  bool upAndUp2Black = upBlack && up2Black && up3Black;
  bool downAndDown2Black = downBlack && down2Black && down3Black;
  bool leftAndLeft2Black = leftBlack && left2Black && left3Black;
  bool rightAndRight2Black = rightBlack && right2Black && right3Black;

  if(upAndUp2White && downAndDown2Black && leftAndLeft2Black && rightAndRight2Black && (upLeftWhite || upRightWhite) && (downLeftBlack && downRightBlack)) {
    result = up;
  } else if(downAndDown2White && upAndUp2Black && leftAndLeft2Black && rightAndRight2Black && (downLeftWhite || downRightWhite) && (upLeftBlack && upRightBlack)) {
    result = down;
  } else if(leftAndLeft2White && rightAndRight2Black && upAndUp2Black && downAndDown2Black && (upLeftWhite || downLeftWhite) && (upRightBlack && downRightBlack)) {
    result = left;
  } else if(rightAndRight2White && leftAndLeft2Black && upAndUp2Black && downAndDown2Black && (upRightWhite || downRightWhite) && (upLeftBlack && downLeftBlack)) {
    result = right;
  } else if(upAndUp2White && leftAndLeft2White && upLeftWhite && downAndDown2Black && rightAndRight2Black && downLeftBlack && downRightBlack) {
    result = upLeft;
  } else if(upAndUp2White && rightAndRight2White && upRightWhite && downAndDown2Black && leftAndLeft2Black && downLeftBlack && downRightBlack) {
    result = upRight;
  } else if(downAndDown2White && leftAndLeft2White && downLeftWhite && upAndUp2Black && rightAndRight2Black && upLeftBlack && upRightBlack) {
    result = downLeft;
  } else if(downAndDown2White && rightAndRight2White && downRightWhite && upAndUp2Black && leftAndLeft2Black && upLeftBlack && upRightBlack) {
    result = downRight;
  } else if(upWhite && upLeftWhite && upRightWhite && downBlack && down2Black && downRightBlack && downLeftBlack) {
    result = up;
  } else if(downWhite && downLeftWhite && downRightWhite && upBlack && up2Black && upRightBlack && upLeftBlack) {
    result = down;
  } else if(rightWhite && upRightWhite && downRightWhite && leftBlack && left2Black && upLeftBlack && downLeftBlack) {
    result = right;
  } else if(leftWhite && upLeftWhite && downLeftWhite && rightBlack && right2Black && upRightBlack && downRightBlack) {
    result = left;

  } else if(result.a < 1.) {
    result = vec4(0);
  }

  // if current pixel is

  gl_FragColor = result;
}
