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

const WIDTH = 256
const AGENT_COUNT = 256

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

  const [positionTexture, setPositionTexture] = useState<THREE.Texture | null>(
    null,
  )

  const [valueVariable, setValueVariable] = useState<Variable | null>(null)

  const [positionVariable, setPositionVariable] = useState<Variable | null>(
    null,
  )

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

  const fillPositionTexture = (texture: THREE.DataTexture) => {
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

  const [computeUniforms, setComputeUniforms] = useState<{
    [uniform: string]: THREE.IUniform<any>
  }>({
    time: { value: 0.0 },
    delta: { value: 0.0 },
    click: { value: new THREE.Vector2(0, 0) },
    isClicked: { value: false },
    fade: { value: 0.0 },
    redColor: { value: new THREE.Color('#ff0000') },
    greenColor: { value: new THREE.Color('#00ff00') },
    blueColor: { value: new THREE.Color('#00ff00') },
    stepInterpolation: { value: 0.0 },
    fadePower: { value: 0.0 },
    radius: { value: 1.0 },
  })

  const [agentUniforms, setAgentUniforms] = useState<{
    [uniform: string]: THREE.IUniform<any>
  }>({
    time: { value: 0.0 },
    delta: { value: 0.0 },
    sapleDistance: { value: 0.0 },
    sampleSpread: { value: 0.0 },
    randomness: { value: 0.0 },
    speed: { value: 0.0 },
    fade: { value: 0.0 },
    redColor: { value: new THREE.Color('#ff0000') },
    greenColor: { value: new THREE.Color('#00ff00') },
    blueColor: { value: new THREE.Color('#00ff00') },
    stepInterpolation: { value: 0.0 },
    fadePower: { value: 0.0 },
    radius: { value: 1.0 },
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

    const dtPosition = gpuCompute.createTexture()
    fillPositionTexture(dtPosition)

    const agentsVariable = gpuCompute.addVariable(
      'textureAgents',
      fragmentShaderAgents,
      dtPosition,
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
    valueVariable.material.uniforms.time = { value: 0.0 }
    valueVariable.material.uniforms.delta = { value: 0.0 }
    valueVariable.material.uniforms.click = { value: new THREE.Vector2(0, 0) }
    valueVariable.material.uniforms.isClicked = { value: false }
    valueVariable.material.uniforms.count = { value: AGENT_COUNT }
    valueVariable.material.uniforms.fade = { value: 0.0 }
    valueVariable.material.uniforms.fadePower = { value: 0.0 }
    valueVariable.material.uniforms.radius = { value: 1.0 }

    valueVariable.material.uniforms.stepInterpolation = {
      value: 0.0,
    }

    valueVariable.material.uniforms.redColor = {
      value: new THREE.Color('#ff0000'),
    }

    valueVariable.material.uniforms.greenColor = {
      value: new THREE.Color('#00ff00'),
    }

    valueVariable.material.uniforms.blueColor = {
      value: new THREE.Color('#0000ff'),
    }

    agentsVariable.material.uniforms.time = { value: 0.0 }
    agentsVariable.material.uniforms.delta = { value: 0.0 }
    agentsVariable.material.uniforms.count = { value: AGENT_COUNT }
    agentsVariable.material.uniforms.sampleDistance = { value: 8.0 }
    agentsVariable.material.uniforms.sampleSpread = { value: 1 / 6 }
    agentsVariable.material.uniforms.randomness = { value: 0.1 }
    agentsVariable.material.uniforms.speed = { value: 1.0 }
    agentsVariable.material.uniforms.fade = { value: 0.0 }
    agentsVariable.material.uniforms.fadePower = { value: 0.0 }
    agentsVariable.material.uniforms.radius = { value: 1.0 }

    agentsVariable.material.uniforms.redColor = {
      value: new THREE.Color('#ff0000'),
    }

    agentsVariable.material.uniforms.greenColor = {
      value: new THREE.Color('#00ff00'),
    }

    agentsVariable.material.uniforms.blueColor = {
      value: new THREE.Color('#0000ff'),
    }

    agentsVariable.material.uniforms.stepInterpolation = {
      value: 0.0,
    }

    setComputeUniforms(valueVariable.material.uniforms)
    setAgentUniforms(agentsVariable.material.uniforms)

    const error = gpuCompute.init()

    if (error !== null) {
      console.error(error)
    }

    setComputeRenderer(gpuCompute)
  }

  const [time, setTime] = useState(0)
  const [delay, setDelay] = useState(0)

  useFrame((state) => {
    //
    if (!computeRenderer) {
      initGpuCompute(state.gl)
    } else {
      const now = performance.now()
      computeUniforms.time.value = now
      computeUniforms.delta.value = now - time
      computeUniforms.fade.value = fade
      computeUniforms.fadePower.value = fadePower
      computeUniforms.radius.value = radius

      if (redColor && computeUniforms.redColor) {
        computeUniforms.redColor.value = new THREE.Color(redColor)

        agentUniforms.redColor.value = new THREE.Color(redColor)
      }

      if (greenColor) {
        computeUniforms.greenColor.value = new THREE.Color(greenColor)

        agentUniforms.greenColor.value = new THREE.Color(greenColor)
      }

      if (blueColor) {
        computeUniforms.blueColor.value = new THREE.Color(blueColor)

        agentUniforms.blueColor.value = new THREE.Color(blueColor)
      }

      agentUniforms.time.value = now
      agentUniforms.delta.value = now - time
      agentUniforms.sampleDistance.value = agentSampleDistance
      agentUniforms.sampleSpread.value = agentSampleSpread
      agentUniforms.randomness.value = agentRandomness
      agentUniforms.speed.value = agentSpeed
      agentUniforms.fade.value = fade
      agentUniforms.stepInterpolation.value = stepInterpolation
      agentUniforms.fadePower.value = fadePower
      agentUniforms.radius.value = radius

      setTime(now)

      setDelay(delay - 1)

      computeRenderer.compute()
      computeUniforms.isClicked.value = false
      computeUniforms.click.value = new THREE.Vector2(0, 0)
      // if (delay < 0) {
      //   setDelay(frameDelay)
      // }

      if (valueVariable) {
        setPlaneTexture(
          computeRenderer.getCurrentRenderTarget(valueVariable).texture,
        )
      }

      if (positionVariable) {
        setPositionTexture(
          computeRenderer.getCurrentRenderTarget(positionVariable).texture,
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
      {computeRenderer && positionTexture && (
        <mesh position-x={-20}>
          <planeGeometry args={[10, 10]} />
          <CustomMaterial map={positionTexture} />
        </mesh>
      )}
    </>
  )
}