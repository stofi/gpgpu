#include "lib.glsl"


void main() {
    // set csm variables
    // csm_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

    vec2 pos = texture2D(map, vUv * vec2(1.,0.)).xy /1024.;
    vec2 vel =texture2D(map, vUv * vec2(1., 0.)).zw;

    if (vUv.y > 0.5) {
        csm_FragColor = vec4(pos, 0.0, 1.0);
    } else {
        csm_FragColor = vec4(vel, 0.0, 1.0);
    }

}
