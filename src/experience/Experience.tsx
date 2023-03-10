import { Suspense, useState } from 'react'

import { PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Debug, Physics } from '@react-three/rapier'

import { Leva } from 'leva'
import { Perf } from 'r3f-perf'

import Scene from './objets/Scene'

export default function Experience(props: { enableDebug?: boolean }) {
  return (
    <>
      <Leva hidden={!props.enableDebug} />
      <Canvas
        flat={true}
        linear={false}
        dpr={1}
        gl={{ antialias: false, alpha: true }}
        camera={{
          position: [0, 0, 10],
        }}
      >
        {props.enableDebug && (
          <>
            <Perf position='top-left' />
            <PerformanceMonitor />
          </>
        )}
        <Suspense>
          <Physics>
            {props.enableDebug && <Debug />}
            <Scene />
          </Physics>
        </Suspense>
      </Canvas>
    </>
  )
}
