import { Environment, OrbitControls } from '@react-three/drei'

import GameOfLife from './GameOfLife'
import Slime from './Slime'

export default function Scene() {
  return (
    <>
      <OrbitControls makeDefault enableRotate={false} />

      <directionalLight position={[3, 10, -5]} />

      <hemisphereLight intensity={0.5} args={['lightblue', 'lightgreen']} />

      <Environment preset='sunset' background={false}></Environment>

      {/* <GameOfLife /> */}
      <Slime />
    </>
  )
}
