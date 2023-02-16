import * as THREE from 'three'
import {
  GPUComputationRenderer,
  Variable,
} from 'three/examples/jsm/misc/GPUComputationRenderer'
import { useEffect, useMemo, useState } from 'react'

import { Environment, Html, OrbitControls } from '@react-three/drei'
import { ThreeEvent, useFrame } from '@react-three/fiber'

import { button, useControls } from 'leva'
import type { Schema } from 'leva/src/types'

import { ControlsFactory, TControl, TUniform } from '../../../ControlsFactory'
// const WIDTH = 1024
import { sRGBChannelToLinear } from '../../../utils'
import simFragment from './sim.glsl'

interface SandProps {
  width?: 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096
}

const controlsOptions: Record<string, TControl> = {
  time: {
    uniformOnly: true,
    value: 0.0,
  },
  delta: {
    uniformOnly: true,
    value: 0.0,
  },

  frameDelay: {
    value: 0,
    min: 0,
    max: 100,
    step: 1,
    controlOnly: true,
    label: 'Delay',
  },

  iterations: {
    value: 1,
    min: 1,
    max: 100,
    step: 1,
    controlOnly: true,
    label: 'Iterations',
  },

  tick: {
    value: 0,
    uniformOnly: true,
  },
  useDebugTextures: {
    value: false,
    controlOnly: true,
  },
  showUv: {
    value: false,
    controlOnly: true,
  },
  image: {
    controlOnly: true,
    image: undefined,
    uniformOnly: false,
  },
}

const controlsFactory = new ControlsFactory(controlsOptions)

export default function MapGenerator({ width = 1024 }: SandProps) {
  const [controls, setControls] = useControls('MapGenerator', () =>
    controlsFactory.getControls(),
  )

  const [computeRenderer, setComputeRenderer] =
    useState<GPUComputationRenderer | null>(null)

  const [stateUniforms, setComputeUniforms] = useState(
    controlsFactory.getUniforms(),
  )
  const [valueVariable, setValueVariable] = useState<Variable | null>(null)

  const initGpuCompute = async (gl: THREE.WebGLRenderer) => {
    const gpuCompute = new GPUComputationRenderer(width, width, gl)

    if (gl.capabilities.isWebGL2 === false) {
      gpuCompute.setDataType(THREE.HalfFloatType)
    }

    const dtValue = gpuCompute.createTexture()

    await fillValueTexture(dtValue)

    const valueVariable = gpuCompute.addVariable(
      'textureValue',
      simFragment,
      dtValue,
    )

    gpuCompute.setVariableDependencies(valueVariable, [valueVariable])

    setValueVariable(valueVariable)

    Object.assign(
      valueVariable.material.uniforms,
      controlsFactory.getUniforms(),
    )

    setComputeUniforms(
      valueVariable.material.uniforms as ReturnType<
        typeof controlsFactory.getUniforms
      >,
    )

    const error = gpuCompute.init()

    if (error !== null) {
      console.error(error)
    }

    setComputeRenderer(gpuCompute)
  }

  const [time, setTime] = useState(0)
  const [delay, setDelay] = useState(controls.frameDelay)

  const fillValueTexture = async (texture: THREE.DataTexture) => {
    const theArray = texture.image.data

    for (let k = 0, kl = theArray.length; k < kl; k += 4) {
      theArray[k + 0] = Math.random()
      theArray[k + 1] = Math.random()
      theArray[k + 2] = Math.random()
      theArray[k + 3] = 0

      if (controls.showUv) {
        theArray[k + 0] = ((k / 4) % width) / width
        theArray[k + 1] = Math.floor(k / 4 / width) / width
        theArray[k + 2] = 0
        // theArray[k + 3] = 1
      }
    }
    // voronoi
    const cellSizePx = width / 4
    const cellSizePxHalf = cellSizePx / 2
    const cellCount = width / cellSizePx
    const randomness = 0.5

    for (let i = 0; i < cellCount; i++) {
      for (let j = 0; j < cellCount; j++) {
        const x =
          i * cellSizePx +
          cellSizePxHalf +
          (Math.random() - 0.5) * randomness * cellSizePx

        const y =
          j * cellSizePx +
          cellSizePxHalf +
          (Math.random() - 0.5) * randomness * cellSizePx

        const intY = Math.floor(y)
        const remainderY = y - intY

        const r = Math.random()
        const g = Math.random()
        const b = Math.random()

        for (let k = 0; k < 9; k++) {
          for (let l = 0; l < 9; l++) {
            const index =
              Math.floor((intY + k) * width + x + remainderY + l) * 4

            theArray[index + 0] = r
            theArray[index + 1] = g
            theArray[index + 2] = b
            theArray[index + 3] = 1
          }
        }
      }
    }

    // diffuse
    // diffuseUint8Array(theArray, width, 2)
  }

  const [valueTexture, setValueTexture] = useState<THREE.Texture | null>(null)

  useFrame(async (state) => {
    //
    if (!computeRenderer) {
      initGpuCompute(state.gl)
    } else {
      const now = performance.now()
      stateUniforms.time.value = now
      stateUniforms.delta.value = now - time

      stateUniforms.tick.value += 1

      setTime(now)

      const d =
        typeof delay === 'number'
          ? delay
          : typeof delay === 'string'
          ? parseInt(delay)
          : 0
      setDelay(d - 1)

      if (delay < 0) {
        const now = performance.now()

        for (let i = 0; i < controls.iterations; i++) {
          computeRenderer.compute()
          stateUniforms.tick.value += 1
        }
        const elapsed = performance.now() - now
        const iters = controls.iterations as number
        const perStep = elapsed / iters
        const stepsPerSecond = 1000 / perStep
        const stepsPerFrame = stepsPerSecond / 60
        const maxIterations = Math.floor(stepsPerFrame)
        const iterations = Math.min(iters, maxIterations)
        // controls.iterations = iterations
        setControls({ iterations })

        setDelay(controls.frameDelay)
      }

      if (valueVariable && !valueTexture) {
        setValueTexture(
          computeRenderer.getCurrentRenderTarget(valueVariable).texture,
        )
      }
    }
  })

  useEffect(() => {
    return () => {
      if (computeRenderer) {
        computeRenderer.dispose()
      }
    }
  }, [])

  return (
    <group>
      {computeRenderer && valueTexture && (
        <mesh>
          <planeGeometry args={[10, 10]} />
          <meshBasicMaterial side={2} map={valueTexture} />
        </mesh>
      )}
    </group>
  )
}

function diffuseUint8Array(
  theArray: Uint8ClampedArray,
  width: number,
  iterations = 1,
) {
  const diffused = new Float32Array(theArray.length)

  for (let j = 0; j < iterations; j++) {
    for (let k = 0; k < 4; k++) {
      for (let i = 0; i < width; i++) {
        for (let j = 0; j < width; j++) {
          const index = (i * width + j) * 4 + k
          const left = ((i - 1 + width) % width) * width + j
          const right = ((i + 1) % width) * width + j
          const up = i * width + ((j - 1 + width) % width)
          const down = i * width + ((j + 1) % width)

          diffused[index] =
            (theArray[index] +
              theArray[left * 4 + k] +
              theArray[right * 4 + k] +
              theArray[up * 4 + k] +
              theArray[down * 4 + k]) /
            5
        }
      }
    }

    for (let k = 0, kl = theArray.length; k < kl; k += 4) {
      theArray[k + 0] = diffused[k + 0]
      theArray[k + 1] = diffused[k + 1]
      theArray[k + 2] = diffused[k + 2]
      theArray[k + 3] = diffused[k + 3]
    }
  }
}
