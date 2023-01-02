import { Environment, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'

import GameOfLife from './GameOfLife'
import Slime from './Slime/Slime'

export default function Scene() {
  return (
    <>
      <OrbitControls makeDefault enableRotate={true} />

      <directionalLight position={[3, 10, -5]} />

      <hemisphereLight intensity={0.5} args={['lightblue', 'lightgreen']} />

      <Environment preset='sunset' background={false}></Environment>

      {/* <GameOfLife /> */}
      {/* <EffectComposer>
        <Bloom
          intensity={10}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.8}
          height={400}
          opacity={3}
        />
      </EffectComposer> */}
      <Slime />
    </>
  )
}
