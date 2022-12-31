#include "lib.glsl"
varying vec2 vUv;
// csm_Position vec3 Custom vertex position.Vertex Shader csm_Position will be projected furthur down the line.Thus, no projection is needed here.csm_PositionRaw vec3 Direct equivalent of gl_Position.Vertex Shader csm_DiffuseColor vec4 Custom diffuse color.Fragment Shader csm_Normal vec3 Custom vertex normals.Vertex Shader 	

void main() {
  vUv = uv;
  // set csm variables
  // csm_Position = vec3(position.x, position.y, position.z);
  // csm_PositionRaw = vec3(position.x, position.y, position.z);
  // csm_Normal = vec3(normal.x, normal.y, normal.z);

}

