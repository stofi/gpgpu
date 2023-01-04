import { useState } from 'react'

import { Environment, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'

import { button, useControls } from 'leva'

import Fluid from './Fluid'
import GameOfLife from './GameOfLife'
import Slime from './Slime/Slime'

type TResolutions = 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096

export default function Scene() {
  const { experiment, resolution } = useControls({
    experiment: {
      value: 'fluid',
      options: ['fluid', 'slime', 'gameOfLife'],
    },
    resolution: {
      value: 512 as TResolutions,
      options: [32, 64, 128, 256, 512, 1024, 2048, 4096] as TResolutions[],
    },
    restart: button(() => {
      onRestart()
    }),
  })
  const [hidden, setHidden] = useState(false)

  const onRestart = () => {
    setHidden(true)

    setTimeout(() => {
      setHidden(false)
    }, 100)
  }

  const experimentComponent = !hidden ? (
    experiment === 'fluid' ? (
      <Fluid width={resolution} />
    ) : experiment === 'slime' ? (
      <Slime width={resolution} />
    ) : (
      <GameOfLife width={resolution} />
    )
  ) : null

  return (
    <>
      <OrbitControls makeDefault enableRotate={true} />

      <directionalLight position={[3, 10, -5]} />

      <hemisphereLight intensity={0.5} args={['lightblue', 'lightgreen']} />

      <Environment preset='sunset' background={false}></Environment>

      {experimentComponent}
    </>
  )
}
