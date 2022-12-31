import * as THREE from 'three'
import {
  GPUComputationRenderer,
  Variable,
} from 'three/examples/jsm/misc/GPUComputationRenderer'
import { useState } from 'react'

import { Environment, OrbitControls } from '@react-three/drei'
import { ThreeEvent, useFrame } from '@react-three/fiber'

import { useControls } from 'leva'

import Sphere from './Sphere'

const WIDTH = 1024 * 4

const fragmentShaderValue = /* glsl */ `
uniform float time;
uniform float delta;
uniform vec2 click;
uniform bool isClicked;

const int NUM_DIRECTIONS = 8;
vec2 directions[NUM_DIRECTIONS] = vec2[](
  vec2(0.0, 1.0 / resolution.y),
  vec2(0.0, -1.0 / resolution.y),
  vec2(1.0 / resolution.x, 0.0),
  vec2(-1.0 / resolution.x, 0.0),
  vec2(1.0 / resolution.x, 1.0 / resolution.y),
  vec2(-1.0 / resolution.x, 1.0 / resolution.y),
  vec2(1.0 / resolution.x, -1.0 / resolution.y),
  vec2(-1.0 / resolution.x, -1.0 / resolution.y)
);

bool customSample(vec2 dUv, vec3 mask) {
  vec4 _v = texture2D(textureValue, dUv);
  mask = normalize(mask);
  float r = _v.x * mask.x;
  float g = _v.y * mask.y;
  float b = _v.z * mask.z;
  return r + g + b > 0.5;
}

bool sampleNeighbour(vec2 dUv, vec2 offset, vec3 mask) {
  return customSample(dUv + offset, mask);
}

int countNeighbours(vec2 dUv, vec3 mask) {
  int count = 0;
  for (int i = 0; i < NUM_DIRECTIONS; i++) {
    if (sampleNeighbour(dUv, directions[i], mask)) {
      count++;
    }
  }
  return count;
}

bool gameOfLife( vec2 dUv, vec3 mask) {
  int count = countNeighbours(dUv, mask);
  bool alive = customSample( dUv, mask);
  vec2 cUv = click / resolution.xy;
  float unit = 1.0 / resolution.x;

  float dist = distance(cUv,dUv);
  if (dist < unit && isClicked) {
    return true;
  }
  
  if (alive) {
    if (count < 2) return false;
    if (count > 3) return false;
    return true;
  } else {
    if (count == 3) return true;
    return false;
  }
}


void main()	{

  vec2 uv = gl_FragCoord.xy / resolution.xy;
  bool r = gameOfLife(uv, vec3(1.,0.,0.));
  bool g = gameOfLife(uv, vec3(0.,1.,0.));
  bool b = gameOfLife(uv, vec3(0.,0.,1.));

  gl_FragColor.r = r ? 1.0 : 0.0;
  gl_FragColor.g = g ? 1.0 : 0.0;
  gl_FragColor.b = b ? 1.0 : 0.0;

}
`

export default function GameOfLife() {
  const { frameDelay } = useControls({
    frameDelay: {
      value: 30,
      min: 0,
      max: 100,
      step: 1,
    },
  })

  const [computeRenderer, setComputeRenderer] =
    useState<GPUComputationRenderer | null>(null)

  const [planeTexture, setPlaneTexture] = useState<THREE.Texture | null>(null)

  const [valueVariable, setValueVariable] = useState<Variable | null>(null)

  const fillValueTexture = (texture: THREE.DataTexture) => {
    const theArray = texture.image.data

    for (let k = 0, kl = theArray.length; k < kl; k += 4) {
      const x = Math.random() > 0.5 ? 1 : 0
      const y = Math.random() > 0.5 ? 1 : 0
      const z = Math.random() > 0.5 ? 1 : 0

      theArray[k + 0] = x
      theArray[k + 1] = y
      theArray[k + 2] = z
      theArray[k + 3] = 1
    }
  }

  const [computeUniforms, setComputeUniforms] = useState<{
    [uniform: string]: THREE.IUniform<any>
  }>({
    time: { value: 0.0 },
    delta: { value: 0.0 },
    click: { value: new THREE.Vector2(0, 0) },
    isClicked: { value: false },
  })

  const initGpuCompute = (gl: THREE.WebGLRenderer) => {
    const gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, gl)

    if (gl.capabilities.isWebGL2 === false) {
      gpuCompute.setDataType(THREE.HalfFloatType)
    }

    const dtValue = gpuCompute.createTexture()
    fillValueTexture(dtValue)

    const valueVariable = gpuCompute.addVariable(
      'textureValue',
      fragmentShaderValue,
      dtValue,
    )

    setValueVariable(valueVariable)

    gpuCompute.setVariableDependencies(valueVariable, [valueVariable])

    valueVariable.material.uniforms.time = { value: 0.0 }
    valueVariable.material.uniforms.delta = { value: 0.0 }
    valueVariable.material.uniforms.click = { value: new THREE.Vector2(0, 0) }
    valueVariable.material.uniforms.isClicked = { value: false }

    setComputeUniforms(valueVariable.material.uniforms)

    const error = gpuCompute.init()

    if (error !== null) {
      console.error(error)
    }

    setComputeRenderer(gpuCompute)
  }

  const [time, setTime] = useState(0)
  const [delay, setDelay] = useState(frameDelay)

  useFrame((state) => {
    //
    if (!computeRenderer) {
      initGpuCompute(state.gl)
    } else {
      const now = performance.now()
      computeUniforms.time.value = now
      computeUniforms.delta.value = now - time

      setTime(now)

      setDelay(delay - 1)

      if (delay < 0) {
        computeRenderer.compute()
        computeUniforms.isClicked.value = false
        computeUniforms.click.value = new THREE.Vector2(0, 0)
        setDelay(frameDelay)
      }

      if (valueVariable) {
        setPlaneTexture(
          computeRenderer.getCurrentRenderTarget(valueVariable).texture,
        )
      }
    }
  })

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // get position of click in pixels based on WIDTH
    const x = Math.floor((e.point.x + 5) * (WIDTH / 10))
    const y = Math.floor((e.point.y + 5) * (WIDTH / 10))

    computeUniforms.click.value = new THREE.Vector2(x, y)
    computeUniforms.isClicked.value = true
  }

  return (
    <>
      {computeRenderer && planeTexture && (
        <mesh onClick={handleClick}>
          <planeGeometry args={[10, 10]} />
          <meshBasicMaterial map={planeTexture} />
        </mesh>
      )}
    </>
  )
}
