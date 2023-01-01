import * as THREE from 'three'
import {
  GPUComputationRenderer,
  Variable,
} from 'three/examples/jsm/misc/GPUComputationRenderer'
import { useState } from 'react'

import { Environment, OrbitControls } from '@react-three/drei'
import { ThreeEvent, useFrame } from '@react-three/fiber'

import { useControls } from 'leva'

import CustomMaterial from '../../materials/CustomMaterial'
import Sphere from '../Sphere'
import fragmentShaderValue from './drawAgents.glsl'
import fragmentShaderAgents from './moveAgents.glsl'

const WIDTH = 1024
const AGENT_COUNT = 1024

type TUniform = {
  [uniform: string]: THREE.IUniform<any>
}

const defaultUniforms: TUniform = {
  time: { value: 0.0 },
  delta: { value: 0.0 },
  count: { value: AGENT_COUNT },
  sampleDistance: { value: 8.0 },
  sampleSpread: { value: 1 / 6 },
  randomness: { value: 0.1 },
  speed: { value: 1.0 },
  fade: { value: 0.0 },
  fadePower: { value: 0.0 },
  radius: { value: 1.0 },
  redColor: { value: new THREE.Color('#ff0000') },
  greenColor: { value: new THREE.Color('#00ff00') },
  blueColor: { value: new THREE.Color('#0000ff') },
  stepInterpolation: { value: 0.0 },
}

const fillValueTexture = (texture: THREE.DataTexture) => {
  const theArray = texture.image.data

  for (let k = 0, kl = theArray.length; k < kl; k += 4) {
    const x = Math.random() > 0.5 ? 1 : 0
    const y = Math.random() > 0.5 ? 1 : 0
    const z = Math.random() > 0.5 ? 1 : 0

    theArray[k + 0] = 0
    theArray[k + 1] = 0
    theArray[k + 2] = 0
    theArray[k + 3] = 1
  }
}

const fillAgentTexture = (texture: THREE.DataTexture) => {
  const theArray = texture.image.data
  let counter = 0

  for (
    let k = 0, kl = theArray.length;
    k < kl || counter == AGENT_COUNT;
    k += 4
  ) {
    // random position in the plane
    theArray[k + 0] = Math.random() * WIDTH
    theArray[k + 1] = Math.random() * WIDTH

    // random velocity
    const vel = new THREE.Vector2(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
    ).normalize()

    theArray[k + 2] = vel.x
    theArray[k + 3] = vel.y
    counter++
  }
}

export default function Slime() {
  const {
    agentSampleDistance,
    agentSampleSpread,
    agentSpeed,
    agentRandomness,
    fade,
    redColor,
    greenColor,
    blueColor,
    stepInterpolation,
    fadePower,
    radius,
  } = useControls({
    radius: {
      value: 2,
      min: 0,
      max: 5,
      step: 0.01,
      label: 'Radius',
    },
    agentSpeed: {
      value: 2,
      min: 0,
      max: 10,
      step: 0.01,
      label: 'Speed',
    },
    agentSampleDistance: {
      value: 50,
      min: 15,
      max: 250,
      step: 0.01,
      label: 'Distance',
    },

    agentRandomness: {
      value: 0.2,
      min: 0,
      max: 1,
      step: 0.01,
      label: 'Randomness',
      hint: 'Factor of random agent movement',
    },
    stepInterpolation: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      label: 'Smoothness',
    },
    agentSampleSpread: {
      value: 0.6,
      min: 0.00001,
      max: Math.PI / 2,
      step: 0.01,
      label: 'Spread',
    },
    fade: {
      value: 0.02,
      min: 0,
      max: 0.1,
      step: 0.01,
      label: 'Fade',
    },
    redColor: {
      value: '#ff0000',
      label: 'Red',
    },
    greenColor: {
      value: '#00ff00',
      label: 'Green',
    },
    blueColor: {
      value: '#0000ff',
      label: 'Blue',
    },

    fadePower: {
      value: 10,
      min: 0,
      max: 10,
      step: 0.01,
      label: 'Fade Power',
    },
  })

  const [computeRenderer, setComputeRenderer] =
    useState<GPUComputationRenderer | null>(null)

  const [planeTexture, setPlaneTexture] = useState<THREE.Texture | null>(null)

  const [valueVariable, setValueVariable] = useState<Variable | null>(null)

  const [positionVariable, setPositionVariable] = useState<Variable | null>(
    null,
  )

  const [time, setTime] = useState(0)
  const [delay, setDelay] = useState(0)

  const [stateUniforms, setStateUniforms] = useState<{
    [uniform: string]: THREE.IUniform<any>
  }>(defaultUniforms)

  const initGpuCompute = (gl: THREE.WebGLRenderer) => {
    const gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, gl)
    const dataType = gl.capabilities.isWebGL2 ? undefined : THREE.HalfFloatType

    const valueTexture = gpuCompute.createTexture()
    fillValueTexture(valueTexture)

    const valueVariable = gpuCompute.addVariable(
      'textureValue',
      fragmentShaderValue,
      valueTexture,
    )
    setValueVariable(valueVariable)

    const positionTexture = gpuCompute.createTexture()
    fillAgentTexture(positionTexture)

    const agentsVariable = gpuCompute.addVariable(
      'textureAgents',
      fragmentShaderAgents,
      positionTexture,
    )

    gpuCompute.setVariableDependencies(valueVariable, [
      agentsVariable,
      valueVariable,
    ])

    gpuCompute.setVariableDependencies(agentsVariable, [
      agentsVariable,
      valueVariable,
    ])
    setPositionVariable(agentsVariable)

    Object.assign(valueVariable.material.uniforms, defaultUniforms)
    Object.assign(agentsVariable.material.uniforms, defaultUniforms)
    setStateUniforms(valueVariable.material.uniforms)

    const error = gpuCompute.init()

    if (error !== null) {
      console.error(error)
    }

    setComputeRenderer(gpuCompute)
  }

  useFrame((state) => {
    if (!computeRenderer) {
      initGpuCompute(state.gl)
    } else {
      const now = performance.now()
      stateUniforms.time.value = now
      stateUniforms.delta.value = now - time
      stateUniforms.fade.value = fade
      stateUniforms.fadePower.value = fadePower
      stateUniforms.radius.value = radius
      stateUniforms.sampleDistance.value = agentSampleDistance
      stateUniforms.sampleSpread.value = agentSampleSpread
      stateUniforms.randomness.value = agentRandomness
      stateUniforms.speed.value = agentSpeed
      stateUniforms.stepInterpolation.value = stepInterpolation

      if (redColor && stateUniforms.redColor) {
        stateUniforms.redColor.value = new THREE.Color(redColor)
      }

      if (greenColor && stateUniforms.greenColor) {
        stateUniforms.greenColor.value = new THREE.Color(greenColor)
      }

      if (blueColor && stateUniforms.blueColor) {
        stateUniforms.blueColor.value = new THREE.Color(blueColor)
      }
      setTime(now)
      setDelay(delay - 1)
      computeRenderer.compute()

      if (valueVariable) {
        setPlaneTexture(
          computeRenderer.getCurrentRenderTarget(valueVariable).texture,
        )
      }
    }
  })

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    const x = Math.floor((e.point.x + 5) * (WIDTH / 10))
    const y = Math.floor((e.point.y + 5) * (WIDTH / 10))
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
