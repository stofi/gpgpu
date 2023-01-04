#include "lib.glsl"
#include "rgb.glsl"

void main() {
    // set csm variables
    // csm_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

    // vec2 pos = texture2D(map, vUv * vec2(1.,0.)).xy /1024.;
    // vec2 vel =texture2D(map, vUv * vec2(1., 0.)).zw;

    // if (vUv.y > 0.5) {
    //     csm_FragColor = vec4(pos, 0.0, 1.0);
    // } else {
    //     csm_FragColor = vec4(vel, 0.0, 1.0);
    // }
  vec4 s = texture2D(map, vUv);
  float d = s.z;
  vec3 color = rotateHue(vec3(1., 0., 0.), d * 3.14159 * 2.);

  csm_FragColor = mix(vec4(0.0, 0.0, 0.0, 1.0), vec4(1.0, 1.0, 1.0, 1.0), d);
  // csm_FragColor = vec4(0., 0., 0., 1.0);
  // csm_FragColor.rg = s.rg * 1024.;
  // csm_FragColor.rgb = color;

}
