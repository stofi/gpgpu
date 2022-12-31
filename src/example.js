import * as THREE from 'three'

import { GPUComputationRenderer } from 'gpucomputationrender-three'

/* TEXTURE WIDTH FOR SIMULATION */
const WIDTH = 32

const fragmentShaderPosition = /* glsl */ `
uniform float time;
uniform float delta;

void main()	{

  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 tmpPos = texture2D( texturePosition, uv );
  vec3 position = tmpPos.xyz;
  float phase = tmpPos.w;
  phase = mod( ( phase + delta +

}
`

let renderer

const BOUNDS = 800,
  BOUNDS_HALF = BOUNDS / 2

let last = performance.now()

let gpuCompute
let positionVariable
let positionUniforms

init()
animate()

function init() {
  initComputeRenderer()
}

function initComputeRenderer() {
  gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, renderer)

  if (renderer.capabilities.isWebGL2 === false) {
    gpuCompute.setDataType(THREE.HalfFloatType)
  }

  const dtPosition = gpuCompute.createTexture()
  fillPositionTexture(dtPosition)

  positionVariable = gpuCompute.addVariable(
    'texturePosition',
    fragmentShaderPosition,
    dtPosition,
  )

  gpuCompute.setVariableDependencies(positionVariable, [positionVariable])

  positionUniforms = positionVariable.material.uniforms

  positionUniforms['time'] = { value: 0.0 }
  positionUniforms['delta'] = { value: 0.0 }

  positionVariable.wrapS = THREE.RepeatWrapping
  positionVariable.wrapT = THREE.RepeatWrapping

  const error = gpuCompute.init()

  if (error !== null) {
    console.error(error)
  }
}

function fillPositionTexture(texture) {
  const theArray = texture.image.data

  for (let k = 0, kl = theArray.length; k < kl; k += 4) {
    const x = Math.random() * BOUNDS - BOUNDS_HALF
    const y = Math.random() * BOUNDS - BOUNDS_HALF
    const z = Math.random() * BOUNDS - BOUNDS_HALF

    theArray[k + 0] = x
    theArray[k + 1] = y
    theArray[k + 2] = z
    theArray[k + 3] = 1
  }
}

//

function animate() {
  requestAnimationFrame(animate)

  render()
}

function render() {
  const now = performance.now()
  let delta = (now - last) / 1000

  if (delta > 1) delta = 1 // safety cap on large deltas
  last = now

  positionUniforms['time'].value = now
  positionUniforms['delta'].value = delta

  gpuCompute.compute()

  // gpuCompute.getCurrentRenderTarget(positionVariable).texture
}
