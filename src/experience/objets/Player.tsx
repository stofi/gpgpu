import * as THREE from 'three'
import { forwardRef } from 'react'

import { useKeyboardControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RigidBodyApi } from '@react-three/rapier'

import type { TKeymap } from '../../keymap'

const Player = forwardRef<RigidBodyApi>(function Player(_props, ref) {
  const [subscribeKeys, getKeys] = useKeyboardControls<TKeymap>()

  const handleInput = (body: RigidBodyApi) => {
    const keys = getKeys()

    const inputDir = new THREE.Vector3()

    if (keys.forward) inputDir.z -= 1
    if (keys.left) inputDir.x -= 1
    if (keys.right) inputDir.x += 1
    if (keys.back) inputDir.z += 1
  }

  useFrame((state, delta) => {
    // get camera from state
    const rigidBody = (ref as any).current as RigidBodyApi | null

    if (!rigidBody) return

    // handleInput(rigidBody)
  })

  return (
    <>
      <RigidBody
        friction={1}
        linearDamping={0.5}
        angularDamping={0.5}
        ref={ref}
        colliders={'ball'}
        position-y={2}
        type={'dynamic'}
      >
        <mesh>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial
            color={'white'}
            roughness={1}
            flatShading={false}
          />
        </mesh>
      </RigidBody>
    </>
  )
})

export default Player
