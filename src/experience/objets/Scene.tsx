import { Environment, OrbitControls } from '@react-three/drei'

import { useControls } from 'leva'

import Sphere from './Sphere'

export default function Scene() {
  const { sphereColor, floorColor } = useControls({
    sphereColor: { value: 'red', label: 'Sphere Color' },
    floorColor: { value: '#5c5c5c', label: 'Floor Color' },
  })

  return (
    <>
      <OrbitControls makeDefault />

      <directionalLight position={[3, 10, -5]} castShadow />

      <hemisphereLight intensity={0.5} args={['lightblue', 'lightgreen']} />

      <Environment preset='sunset' background={false}></Environment>

      <Sphere color={sphereColor} />

      <mesh receiveShadow rotation-x={-Math.PI * 0.5} position-y={-0.001}>
        <planeGeometry args={[10, 10]} />

        <meshStandardMaterial color={floorColor} roughness={0.8} />
      </mesh>
    </>
  )
}
