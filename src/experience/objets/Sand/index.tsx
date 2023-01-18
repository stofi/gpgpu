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
import debugFragment from './debug.glsl'
import moveDownFragment from './move/moveDown.glsl'
import moveDownLeftFragment from './move/moveDownLeft.glsl'
import moveDownRightFragment from './move/moveDownRight.glsl'
import moveLeftFragment from './move/moveLeft.glsl'
import moveRightFragment from './move/moveRight.glsl'
import simFragment from './sim.glsl'
import solidFragment from './solid.glsl'

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
    value: 1,
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
  enableFall: {
    value: true,
    label: 'Fall',
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

export default function Sand({ width = 1024 }: SandProps) {
  const [controls, setControls] = useControls('Falling Sand', () =>
    controlsFactory.getControls(),
  )

  // const test = useControls('Test', { test: 0 })

  const [computeRenderer, setComputeRenderer] =
    useState<GPUComputationRenderer | null>(null)

  const [stateUniforms, setComputeUniforms] = useState(
    controlsFactory.getUniforms(),
  )
  const [valueVariable, setValueVariable] = useState<Variable | null>(null)
  const [solidVariable, setSolidVariable] = useState<Variable | null>(null)

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

    gpuCompute.setVariableDependencies(valueVariable, [
      valueVariable,
      solidVariable,
    ])

    gpuCompute.setVariableDependencies(solidVariable, [
      valueVariable,
      solidVariable,
    ])

    setValueVariable(valueVariable)
    setSolidVariable(solidVariable)

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
        // flip on horizontal axis
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
    img.src = (controls.image as string) ?? '/skeleton.png'
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

      if (controls.showUv) {
        theArray[k + 0] = ((k / 4) % width) / width
        theArray[k + 1] = Math.floor(k / 4 / width) / width
        theArray[k + 2] = 0
        // theArray[k + 3] = 1
      }
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

  const [valueTexture, setValueTexture] = useState<THREE.Texture | null>(null)

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
      stateUniforms.enableFall.value = controls.enableFall
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
        stateUniforms.isClicked.value = false
        stateUniforms.click.value = new THREE.Vector2(0, 0)

        setDelay(controls.frameDelay)
      }

      if (valueVariable && !valueTexture) {
        setValueTexture(
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
    <group>
      {computeRenderer && valueTexture && (
        <mesh onClick={handleClick} onPointerMove={handleMove}>
          <planeGeometry args={[10, 10]} />
          <meshBasicMaterial side={2} map={valueTexture} />
        </mesh>
      )}
    </group>
  )
}
