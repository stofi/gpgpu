import * as THREE from 'three'
import {
  GPUComputationRenderer,
  Variable,
} from 'three/examples/jsm/misc/GPUComputationRenderer'
import { useEffect, useState } from 'react'

import { Environment, OrbitControls } from '@react-three/drei'
import { RootState, ThreeEvent, useFrame } from '@react-three/fiber'

import { button, useControls } from 'leva'

import Sphere from '../Sphere'
import fragmentShaderValue from './value.glsl'

interface GameOfLifeProps {
  width?: 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096
  onRestart?: () => void
}

export default function GameOfLife({
  width = 1024,
  onRestart,
}: GameOfLifeProps) {
  const { frameDelay, separateRGB } = useControls('Game of Life', {
    frameDelay: {
      value: 1,
      min: 0,
      max: 100,
      step: 1,
    },
    separateRGB: {
      value: true,
    },
  })

  const [computeRenderer, setComputeRenderer] =
    useState<GPUComputationRenderer | null>(null)

  const [planeTexture, setPlaneTexture] = useState<THREE.Texture | null>(null)

  const [valueVariable, setValueVariable] = useState<Variable | null>(null)

  const fillValueTexture = (texture: THREE.DataTexture) => {
    const theArray = texture.image.data

    for (let k = 0, kl = theArray.length; k < kl; k += 4) {
      if (separateRGB) {
        const x = Math.random() > 0.5 ? 1 : 0
        const y = Math.random() > 0.5 ? 1 : 0
        const z = Math.random() > 0.5 ? 1 : 0

        theArray[k + 0] = x
        theArray[k + 1] = y
        theArray[k + 2] = z
        theArray[k + 3] = 1
      } else {
        const x = Math.random() > 0.5 ? 1 : 0

        theArray[k + 0] = x
        theArray[k + 1] = x
        theArray[k + 2] = x
        theArray[k + 3] = 1
      }
    }
  }

  const [computeUniforms, setComputeUniforms] = useState<{
    [uniform: string]: THREE.IUniform<any>
  }>({
    time: { value: 0.0 },
    delta: { value: 0.0 },
    click: { value: new THREE.Vector2(0, 0) },
    isClicked: { value: false },
    separateRGB: { value: true },
  })

  const initGpuCompute = (gl: THREE.WebGLRenderer) => {
    const gpuCompute = new GPUComputationRenderer(width, width, gl)

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
    valueVariable.material.uniforms.separateRGB = { value: true }

    setComputeUniforms(valueVariable.material.uniforms)

    const error = gpuCompute.init()

    if (error !== null) {
      console.error(error)
    }

    setComputeRenderer(gpuCompute)
  }

  const [time, setTime] = useState(0)
  const [delay, setDelay] = useState(frameDelay)
  const [state, setState] = useState<RootState | null>(null)

  useFrame((state) => {
    //
    if (!computeRenderer) {
      initGpuCompute(state.gl)
      setState(state)
    } else {
      const now = performance.now()
      computeUniforms.time.value = now
      computeUniforms.delta.value = now - time
      computeUniforms.separateRGB.value = separateRGB

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
    const x = Math.floor((e.point.x + 5) * (width / 10))
    const y = Math.floor((e.point.y + 5) * (width / 10))

    computeUniforms.click.value = new THREE.Vector2(x, y)
    computeUniforms.isClicked.value = true
  }

  useEffect(() => {
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
          <meshBasicMaterial map={planeTexture} />
        </mesh>
      )}
    </>
  )
}
