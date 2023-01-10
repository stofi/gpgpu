import * as THREE from 'three'
import {
  GPUComputationRenderer,
  Variable,
} from 'three/examples/jsm/misc/GPUComputationRenderer'
import { useEffect, useMemo, useState } from 'react'

import { Environment, OrbitControls } from '@react-three/drei'
import { ThreeEvent, useFrame } from '@react-three/fiber'

import { useControls } from 'leva'
import type { Schema } from 'leva/src/types'

import { ControlsFactory, TControl, TUniform } from '../../../ControlsFactory'
// const WIDTH = 1024
import { sRGBChannelToLinear } from '../../../utils'
import simFragment from './sim.glsl'
import solidFragment from './solid.glsl'

interface SandProps {
  width?: 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096
}

const controlsOptions = {
  time: {
    uniformOnly: true,
    value: 0.0,
  },
  delta: {
    uniformOnly: true,
    value: 0.0,
  },
  click: {
    uniformOnly: true,
    value: new THREE.Vector2(0, 0),
  },
  isClicked: {
    uniformOnly: true,
    value: false,
  },

  clickMask: {
    value: 1,
    options: {
      sand: 1,
      solid: 2,
      erase: 3,
    },
    label: 'Brush',
  },
  brushSize: {
    value: 5,
    min: 1,
    max: 100,
    step: 0.01,
    label: 'Size',
  },
  brushColor: {
    value: '#b88d33',
    label: 'Color',
  },
  brushColorRandom: {
    value: false,
    label: 'Random',
  },
  frameDelay: {
    value: 0,
    min: 0,
    max: 100,
    step: 1,
    controlOnly: true,
    label: 'Delay',
  },
  alphaThreshold: {
    value: 0.05,
    min: 0,
    max: 1,
    step: 0.01,
    controlOnly: true,
    label: 'Threshold',
  },
  iterations: {
    value: 20,
    min: 1,
    max: 100,
    step: 1,
    controlOnly: true,
    label: 'Iterations',
  },
  enableDiagonal: {
    value: true,
    label: 'Diagonal',
  },
  enableSlide: {
    value: true,
    label: 'Slide',
  },
  tick: {
    value: 0,
    uniformOnly: true,
  },
}

const controlsFactory = new ControlsFactory(controlsOptions)

export default function Sand({ width = 1024 }: SandProps) {
  const controls = useControls('Falling Sand', controlsFactory.getControls())
  // const test = useControls('Test', { test: 0 })

  const [computeRenderer, setComputeRenderer] =
    useState<GPUComputationRenderer | null>(null)

  const [planeTexture, setPlaneTexture] = useState<THREE.Texture | null>(null)

  const [valueVariable, setValueVariable] = useState<Variable | null>(null)
  const [solidVariable, setSolidVariable] = useState<Variable | null>(null)

  const [stateUniforms, setComputeUniforms] = useState(
    controlsFactory.getUniforms(),
  )

  const initGpuCompute = async (gl: THREE.WebGLRenderer) => {
    const gpuCompute = new GPUComputationRenderer(width, width, gl)

    if (gl.capabilities.isWebGL2 === false) {
      gpuCompute.setDataType(THREE.HalfFloatType)
    }

    const dtValue = gpuCompute.createTexture()
    const dtSolid = gpuCompute.createTexture()
    await fillValueTexture(dtValue)
    await fillSolidTexture(dtSolid)

    const valueVariable = gpuCompute.addVariable(
      'textureValue',
      simFragment,
      dtValue,
    )

    const solidVariable = gpuCompute.addVariable(
      'textureSolid',
      solidFragment,
      dtSolid,
    )

    setValueVariable(valueVariable)
    setSolidVariable(solidVariable)

    gpuCompute.setVariableDependencies(valueVariable, [
      valueVariable,
      solidVariable,
    ])
    gpuCompute.setVariableDependencies(solidVariable, [solidVariable])

    Object.assign(
      valueVariable.material.uniforms,
      controlsFactory.getUniforms(),
    )

    Object.assign(
      solidVariable.material.uniforms,
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
        context.drawImage(img, 0, 0, width, width)

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        )

        setSkeletonImageData(imageData)
      }
    }
    img.src = '/skeleton.png'
  }

  const fillValueTexture = async (texture: THREE.DataTexture) => {
    const theArray = texture.image.data
    const skeleton = skeletonImageData?.data

    for (let k = 0, kl = theArray.length; k < kl; k += 4) {
      let s = skeleton ? skeleton[k] / 255 : 0
      s = sRGBChannelToLinear(s)
      const th = s > controls.alphaThreshold ? 1 : 0

      theArray[k + 0] =
        sRGBChannelToLinear(skeleton ? skeleton[k + 0] / 255 : 0) * th

      theArray[k + 1] =
        sRGBChannelToLinear(skeleton ? skeleton[k + 1] / 255 : 0) * th

      theArray[k + 2] =
        sRGBChannelToLinear(skeleton ? skeleton[k + 2] / 255 : 0) * th

      theArray[k + 3] =
        sRGBChannelToLinear(skeleton ? skeleton[k + 3] / 255 : 0) * th
    }
  }

  const fillSolidTexture = async (texture: THREE.DataTexture) => {
    const theArray = texture.image.data

    for (let k = 0, kl = theArray.length; k < kl; k += 4) {
      theArray[k + 0] = 0
      theArray[k + 1] = 0
      theArray[k + 2] = 0
      theArray[k + 3] = 0
    }
  }

  useFrame(async (state) => {
    if (!skeletonImageData) return

    //
    if (!computeRenderer) {
      initGpuCompute(state.gl)
    } else {
      const now = performance.now()
      stateUniforms.time.value = now
      stateUniforms.delta.value = now - time
      stateUniforms.clickMask.value = controls.clickMask

      stateUniforms.brushSize.value = controls.brushSize
      stateUniforms.brushColorRandom.value = controls.brushColorRandom
      stateUniforms.enableDiagonal.value = controls.enableDiagonal
      stateUniforms.enableSlide.value = controls.enableSlide
      stateUniforms.tick.value += 1

      stateUniforms.brushColor.value = new THREE.Color(
        controls.brushColor as string,
      )
      setTime(now)

      const d =
        typeof delay === 'number'
          ? delay
          : typeof delay === 'string'
          ? parseInt(delay)
          : 0
      setDelay(d - 1)

      if (delay < 0) {
        for (let i = 0; i < controls.iterations; i++) {
          computeRenderer.compute()
          stateUniforms.tick.value += 1
        }
        stateUniforms.isClicked.value = false
        stateUniforms.click.value = new THREE.Vector2(0, 0)

        setDelay(controls.frameDelay)
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

    stateUniforms.click.value = new THREE.Vector2(x, y)
    stateUniforms.isClicked.value = true
  }

  const handleMove = (e: ThreeEvent<MouseEvent>) => {
    // is mouse down?
    if (!e.buttons) return
    // if primary button is not pressed, return
    if (e.buttons !== 1) return
    // get position of click in pixels based on width
    const x = Math.floor((e.point.x + 5) * (width / 10))
    const y = Math.floor((e.point.y + 5) * (width / 10))

    stateUniforms.click.value = new THREE.Vector2(x, y)
    stateUniforms.isClicked.value = true
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
        <mesh onClick={handleClick} onPointerMove={handleMove}>
          <planeGeometry args={[10, 10]} />
          <meshBasicMaterial side={2} map={planeTexture} />
        </mesh>
      )}
    </>
  )
}
