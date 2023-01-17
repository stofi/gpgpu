import * as THREE from 'three'
import {
  GPUComputationRenderer,
  Variable,
} from 'three/examples/jsm/misc/GPUComputationRenderer'
import { useEffect, useMemo, useState } from 'react'

import { Environment, OrbitControls } from '@react-three/drei'
import { ThreeEvent, useFrame } from '@react-three/fiber'

import { useControls } from 'leva'

import FluidMaterial from '../../materials/FluidMaterial'
import sim from './sim.glsl'

// const WIDTH = 1024

type TUniform = {
  [uniform: string]: THREE.IUniform<any>
}
// uniform float time;
// uniform float delta;
// uniform vec2 click;
// uniform bool isClicked;

const defaultUniforms: TUniform = {
  time: { value: 0.0 },
  delta: { value: 0.0 },
  click: { value: new THREE.Vector2(0, 0) },
  isClicked: { value: false },
  noiseScale: { value: 0.5 },
  noiseScale2: { value: 0.5 },
  reverseVelocityMixFactor: { value: 0.05 },
  velocityThreshold: { value: 0.5 },
  smoothFactor: { value: 0.5 },
}

interface FluidProps {
  width?: 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096
}

export default function Fluid({ width = 1024 }: FluidProps) {
  const {
    frameDelay,
    noiseScale,
    noiseScale2,
    reverseVelocityMixFactor,
    velocityThreshold,
    smoothFactor,
  } = useControls('Fluid Glitch', {
    frameDelay: {
      value: 0,
      min: 0,
      max: 100,
      step: 1,
    },
    noiseScale: {
      value: 1,
      min: 0,
      max: 100,
      step: 0.01,
    },
    noiseScale2: {
      value: 0.001,
      min: 0,
      max: 1,
      step: 0.01,
    },
    reverseVelocityMixFactor: {
      value: 0.9,
      min: 0,
      max: 1,
      step: 0.01,
    },
    velocityThreshold: {
      value: 0.001,
      min: 0,
      max: 0.1,
      step: 0.001,
    },
    smoothFactor: {
      value: 0.05,
      min: 0,
      max: 1,
      step: 0.01,
    },
  })

  const [computeRenderer, setComputeRenderer] =
    useState<GPUComputationRenderer | null>(null)

  const [planeTexture, setPlaneTexture] = useState<THREE.Texture | null>(null)

  const [valueVariable, setValueVariable] = useState<Variable | null>(null)

  const [computeUniforms, setComputeUniforms] = useState<{
    [uniform: string]: THREE.IUniform<any>
  }>(defaultUniforms)

  const initGpuCompute = async (
    gl: THREE.WebGLRenderer,
    uniforms: TUniform,
  ) => {
    const gpuCompute = new GPUComputationRenderer(width, width, gl)

    if (gl.capabilities.isWebGL2 === false) {
      gpuCompute.setDataType(THREE.HalfFloatType)
    }

    const dtValue = gpuCompute.createTexture()
    await fillValueTexture(dtValue)

    const valueVariable = gpuCompute.addVariable('textureValue', sim, dtValue)

    setValueVariable(valueVariable)

    gpuCompute.setVariableDependencies(valueVariable, [valueVariable])

    Object.assign(valueVariable.material.uniforms, uniforms)

    setComputeUniforms(valueVariable.material.uniforms)

    const error = gpuCompute.init()

    if (error !== null) {
      console.error(error)
    }

    setComputeRenderer(gpuCompute)
  }

  const [time, setTime] = useState(0)
  const [delay, setDelay] = useState(frameDelay)

  const [skeletonImageData, setSkeletonImageData] = useState<ImageData | null>(
    null,
  )

  const initSkeleton = () => {
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = width

      const context = canvas.getContext('2d')

      if (context) {
        context.save()
        context.scale(1, -1)

        context.drawImage(img, 0, 0, width, -1 * width)

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        )
        context.restore()
        setSkeletonImageData(imageData)
      }
    }
    img.src = '/skeleton.png'
  }

  const fillValueTexture = async (texture: THREE.DataTexture) => {
    const theArray = texture.image.data
    const skeleton = skeletonImageData?.data

    for (let k = 0, kl = theArray.length; k < kl; k += 4) {
      const x = 0
      const y = 0
      const z = Math.random()
      const s = skeleton ? skeleton[k] / 255 : 0

      theArray[k + 0] = x
      theArray[k + 1] = y
      theArray[k + 2] = s
      theArray[k + 3] = 1
    }
  }

  useFrame(async (state) => {
    if (!skeletonImageData) return

    //
    if (!computeRenderer) {
      initGpuCompute(state.gl, defaultUniforms)
    } else {
      const now = performance.now()
      computeUniforms.time.value = now
      computeUniforms.delta.value = now - time
      computeUniforms.noiseScale.value = noiseScale
      computeUniforms.noiseScale2.value = noiseScale2
      computeUniforms.reverseVelocityMixFactor.value = reverseVelocityMixFactor
      computeUniforms.velocityThreshold.value = velocityThreshold
      computeUniforms.smoothFactor.value = smoothFactor
      setTime(now)

      setDelay(delay - 1)

      if (delay < 0) {
        computeRenderer.compute()
        computeUniforms.isClicked.value = false
        computeUniforms.click.value = new THREE.Vector2(0, 0)
        setDelay(frameDelay)
      }

      if (valueVariable && !planeTexture) {
        setPlaneTexture(
          computeRenderer.getCurrentRenderTarget(valueVariable).texture,
        )
      }
    }
  })

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // get position of click in pixels based on width
    const x = Math.floor((e.point.x + 5) * (width / 10))
    const y = Math.floor((e.point.y + 5) * (width / 10))

    computeUniforms.click.value = new THREE.Vector2(x, y)
    computeUniforms.isClicked.value = true
  }

  useEffect(() => {
    initSkeleton()

    return () => {
      if (computeRenderer) {
        computeRenderer.dispose()
      }
    }
  }, [])

  return (
    <>
      {computeRenderer && planeTexture && (
        <mesh onClick={handleClick}>
          <planeGeometry args={[10, 10]} />
          <FluidMaterial map={planeTexture} />
        </mesh>
      )}
    </>
  )
}
