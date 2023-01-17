import * as THREE from 'three'
import {
  GPUComputationRenderer,
  Variable,
} from 'three/examples/jsm/misc/GPUComputationRenderer'
import { useEffect, useMemo, useState } from 'react'

import { Environment, Html, OrbitControls } from '@react-three/drei'
import { ThreeEvent, useFrame } from '@react-three/fiber'

import { useControls } from 'leva'
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
}

const controlsFactory = new ControlsFactory(controlsOptions)

export default function Sand({ width = 1024 }: SandProps) {
  const controls = useControls('Falling Sand', controlsFactory.getControls())
  // const test = useControls('Test', { test: 0 })

  const [computeRenderer, setComputeRenderer] =
    useState<GPUComputationRenderer | null>(null)

  const [stateUniforms, setComputeUniforms] = useState(
    controlsFactory.getUniforms(),
  )
  const [valueVariable, setValueVariable] = useState<Variable | null>(null)
  const [solidVariable, setSolidVariable] = useState<Variable | null>(null)

  const [moveDownVariable, setMoveDownVariable] = useState<Variable | null>(
    null,
  )

  const [moveDownRightVariable, setMoveDownRightVariable] =
    useState<Variable | null>(null)

  const [moveDownLeftVariable, setMoveDownLeftVariable] =
    useState<Variable | null>(null)

  const [moveRightVariable, setMoveRightVariable] = useState<Variable | null>(
    null,
  )

  const initGpuCompute = async (gl: THREE.WebGLRenderer) => {
    const gpuCompute = new GPUComputationRenderer(width, width, gl)

    if (gl.capabilities.isWebGL2 === false) {
      gpuCompute.setDataType(THREE.HalfFloatType)
    }

    const dtValue = gpuCompute.createTexture()
    const dtSolid = gpuCompute.createTexture()

    const moveDown = gpuCompute.createTexture()
    const moveDownRight = gpuCompute.createTexture()
    const moveDownLeft = gpuCompute.createTexture()
    const moveRight = gpuCompute.createTexture()
    const moveLeft = gpuCompute.createTexture()

    const dtDebug = gpuCompute.createTexture()

    await fillValueTexture(dtValue)
    await fillSolidTexture(dtSolid)

    await fillSolidTexture(moveDown)
    await fillSolidTexture(moveDownRight)
    await fillSolidTexture(moveDownLeft)
    await fillSolidTexture(moveRight)
    await fillSolidTexture(moveLeft)

    await fillSolidTexture(dtDebug)

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

    const moveDownVariable = gpuCompute.addVariable(
      'textureMoveDown',
      moveDownFragment,
      moveDown,
    )

    const moveDownRightVariable = gpuCompute.addVariable(
      'textureMoveDownRight',
      moveDownRightFragment,
      moveDownRight,
    )

    const moveDownLeftVariable = gpuCompute.addVariable(
      'textureMoveDownLeft',
      moveDownLeftFragment,
      moveDownLeft,
    )

    const moveRightVariable = gpuCompute.addVariable(
      'textureMoveRight',
      moveRightFragment,
      moveRight,
    )

    const moveLeftVariable = gpuCompute.addVariable(
      'textureMoveLeft',
      moveLeftFragment,
      moveLeft,
    )

    const debugVariable = gpuCompute.addVariable(
      'textureDebug',
      debugFragment,
      dtDebug,
    )

    gpuCompute.setVariableDependencies(valueVariable, [
      valueVariable,
      solidVariable,
      moveDownVariable,
      moveDownRightVariable,
      moveDownLeftVariable,
      moveRightVariable,
      moveLeftVariable,
    ])

    gpuCompute.setVariableDependencies(solidVariable, [
      valueVariable,
      solidVariable,
    ])

    gpuCompute.setVariableDependencies(moveDownVariable, [
      moveDownVariable,
      valueVariable,
      solidVariable,
    ])

    gpuCompute.setVariableDependencies(moveDownRightVariable, [
      moveDownVariable,
      moveDownRightVariable,
      moveDownLeftVariable,
      valueVariable,
      solidVariable,
    ])

    gpuCompute.setVariableDependencies(moveDownLeftVariable, [
      moveDownVariable,
      moveDownRightVariable,
      moveDownLeftVariable,
      valueVariable,
      solidVariable,
    ])

    gpuCompute.setVariableDependencies(moveRightVariable, [
      moveDownVariable,
      moveDownRightVariable,
      moveDownLeftVariable,
      moveRightVariable,
      moveLeftVariable,
      valueVariable,
      solidVariable,
    ])

    gpuCompute.setVariableDependencies(moveLeftVariable, [
      moveDownVariable,
      moveDownRightVariable,
      moveDownLeftVariable,
      moveRightVariable,
      moveLeftVariable,
      valueVariable,
      solidVariable,
    ])

    gpuCompute.setVariableDependencies(debugVariable, [
      valueVariable,
      solidVariable,
      moveDownVariable,
      moveDownRightVariable,
      moveDownLeftVariable,
      moveRightVariable,
      moveLeftVariable,
      debugVariable,
    ])

    setValueVariable(valueVariable)
    setSolidVariable(solidVariable)
    setMoveDownVariable(moveDownVariable)
    setMoveDownRightVariable(moveDownRightVariable)
    setMoveDownLeftVariable(moveDownLeftVariable)
    setMoveRightVariable(moveRightVariable)
    setMoveLeftVariable(moveLeftVariable)

    setDebugVariable(debugVariable)

    Object.assign(
      valueVariable.material.uniforms,
      controlsFactory.getUniforms(),
    )

    Object.assign(
      solidVariable.material.uniforms,
      controlsFactory.getUniforms(),
    )

    Object.assign(
      moveDownVariable.material.uniforms,
      controlsFactory.getUniforms(),
    )

    Object.assign(
      moveDownRightVariable.material.uniforms,
      controlsFactory.getUniforms(),
    )

    Object.assign(
      moveDownLeftVariable.material.uniforms,
      controlsFactory.getUniforms(),
    )

    Object.assign(
      moveRightVariable.material.uniforms,
      controlsFactory.getUniforms(),
    )

    Object.assign(
      moveLeftVariable.material.uniforms,
      controlsFactory.getUniforms(),
    )

    Object.assign(
      debugVariable.material.uniforms,
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

  const [moveLeftVariable, setMoveLeftVariable] = useState<Variable | null>(
    null,
  )

  const [valueTexture, setValueTexture] = useState<THREE.Texture | null>(null)
  const [solidTexture, setSolidTexture] = useState<THREE.Texture | null>(null)

  const [moveDownTexture, setMoveDownTexture] = useState<THREE.Texture | null>(
    null,
  )

  const [moveDownRightTexture, setMoveDownRightTexture] =
    useState<THREE.Texture | null>(null)

  const [moveDownLeftTexture, setMoveDownLeftTexture] =
    useState<THREE.Texture | null>(null)

  const [moveRightTexture, setMoveRightTexture] =
    useState<THREE.Texture | null>(null)

  const [moveLeftTexture, setMoveLeftTexture] = useState<THREE.Texture | null>(
    null,
  )

  const [debugTexture, setDebugTexture] = useState<THREE.Texture | null>(null)

  const [debugVariable, setDebugVariable] = useState<Variable | null>(null)

  const [internalDebugTexture, setInternalDebugTexture] = useState(false)

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
        for (let i = 0; i < controls.iterations; i++) {
          computeRenderer.compute()
          stateUniforms.tick.value += 1
        }
        stateUniforms.isClicked.value = false
        stateUniforms.click.value = new THREE.Vector2(0, 0)

        setDelay(controls.frameDelay)
      }

      if (valueVariable && !valueTexture) {
        setValueTexture(
          computeRenderer.getCurrentRenderTarget(valueVariable).texture,
        )
      }

      if (controls.useDebugTextures) {
        if (solidVariable && !solidTexture) {
          setSolidTexture(
            computeRenderer.getCurrentRenderTarget(solidVariable).texture,
          )
        }

        if (moveDownVariable && !moveDownTexture) {
          setMoveDownTexture(
            computeRenderer.getCurrentRenderTarget(moveDownVariable).texture,
          )
        }

        if (moveDownRightVariable && !moveDownRightTexture) {
          setMoveDownRightTexture(
            computeRenderer.getCurrentRenderTarget(moveDownRightVariable)
              .texture,
          )
        }

        if (moveDownLeftVariable && !moveDownLeftTexture) {
          setMoveDownLeftTexture(
            computeRenderer.getCurrentRenderTarget(moveDownLeftVariable)
              .texture,
          )
        }

        if (moveRightVariable && !moveRightTexture) {
          setMoveRightTexture(
            computeRenderer.getCurrentRenderTarget(moveRightVariable).texture,
          )
        }

        if (moveLeftVariable && !moveLeftTexture) {
          setMoveLeftTexture(
            computeRenderer.getCurrentRenderTarget(moveLeftVariable).texture,
          )
        }

        if (debugVariable && !debugTexture) {
          setDebugTexture(
            computeRenderer.getCurrentRenderTarget(debugVariable).texture,
          )
        }
        setInternalDebugTexture(true)
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
      {controls.useDebugTextures && internalDebugTexture && (
        <>
          <mesh position={[0, 12, 0]}>
            <Html center position={[0, -6, 0]}>
              <div className='text-center text-white'>solidTexture</div>
            </Html>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial side={2} map={solidTexture} />
          </mesh>

          <mesh position={[0, -12, 0]}>
            <Html center position={[0, -6, 0]}>
              <div className='text-center text-white'>moveDown</div>
            </Html>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial side={2} map={moveDownTexture} />
          </mesh>

          <mesh position={[12, -12, 0]}>
            <Html center position={[0, -6, 0]}>
              <div className='text-center text-white'>moveDownRight</div>
            </Html>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial side={2} map={moveDownRightTexture} />
          </mesh>

          <mesh position={[-12, -12, 0]}>
            <Html center position={[0, -6, 0]}>
              <div className='text-center text-white'>moveDownLeft</div>
            </Html>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial side={2} map={moveDownLeftTexture} />
          </mesh>

          <mesh position={[12, 0, 0]}>
            <Html center position={[0, -6, 0]}>
              <div className='text-center text-white'>moveRight</div>
            </Html>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial side={2} map={moveRightTexture} />
          </mesh>

          <mesh position={[-12, 0, 0]}>
            <Html center position={[0, -6, 0]}>
              <div className='text-center text-white'>moveLeft</div>
            </Html>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial side={2} map={moveLeftTexture} />
          </mesh>

          <mesh position={[-12, 12, 0]}>
            <Html center position={[0, -6, 0]}>
              <div className='text-center text-white'>debug</div>
            </Html>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial side={2} map={debugTexture} />
          </mesh>
        </>
      )}
    </group>
  )
}
