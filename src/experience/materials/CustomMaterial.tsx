import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

import { useControls } from 'leva'

import fragmentShader from '../shaders/example/fragment.glsl'
import vertexShader from '../shaders/example/vertex.glsl'

const textures = [
  './textures/snow/albedo.jpg',
  './textures/snow/roughness.jpg',
  './textures/snow/normal.jpg',
]

const textureHandler = (texture: THREE.Texture | THREE.Texture[]) => {
  if (Array.isArray(texture)) {
    texture.forEach(textureHandler)

    return
  }
  texture.encoding = THREE.sRGBEncoding
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.minFilter = THREE.LinearFilter

  texture.needsUpdate = true
}

export default function CustomMaterial(props: { color?: string }) {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)

  // const [albedo, roughness, normal] = useTexture(textures, textureHandler)

  const { t1 } = useControls({
    t1: {
      value: 0.0,
      min: 0,
      max: 1,
    },
  })

  const updateUniforms = () => {
    if (!materialRef.current) return

    // materialRef.current.uniforms['uT_1'].value = t1
  }

  useFrame(() => {
    updateUniforms()
  })

  return (
    <CustomShaderMaterial
      color={props.color}
      baseMaterial={THREE.MeshStandardMaterial}
      ref={materialRef}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      uniforms={{}}
    />
  )
}
