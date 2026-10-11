import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BUBBLE_GEO } from '../../lib/lab3d/resources'
import { BEAKER } from '../../lib/lab3d/layout'
import { burstState, gasParticle } from '../../lib/reactionVisuals'

/** Bright illustrative gas markers above the mouth; real hydrogen is colourless. */
export default function GasRelease({ effects }) {
  const gas = useRef(null)
  const burst = useRef(null)
  const started = useRef(0)
  const reduced = useRef(false)
  const explosion = Boolean(effects?.explosion)
  useEffect(() => {
    started.current = performance.now()
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { reduced.current = media.matches }
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [explosion])
  useFrame(({ clock }) => {
    const rate = effects?.bubbleRate ?? 0
    if (gas.current) {
      gas.current.visible = rate > 0 && Boolean(effects?.gas)
      gas.current.children.forEach((mesh, i) => {
        const p = gasParticle(clock.elapsedTime, i, rate)
        const angle = i * 2.4
        mesh.position.set(Math.cos(angle) * p.spread, BEAKER.height + 0.015 + p.rise * 0.38, Math.sin(angle) * p.spread)
        mesh.scale.setScalar(0.008 + p.rise * 0.01)
        mesh.material.opacity = reduced.current ? 0.28 : p.opacity
      })
    }
    if (burst.current) {
      const state = burstState((performance.now() - started.current) / 1000)
      burst.current.visible = explosion && state.active && !reduced.current
      burst.current.children.forEach((mesh, i) => {
        const angle = i * 2.4
        const distance = state.progress * (0.16 + (i % 4) * 0.05)
        mesh.position.set(Math.cos(angle) * distance, BEAKER.height + 0.04 + Math.sin(i * 1.7) * distance + state.progress * 0.13, Math.sin(angle) * distance)
        mesh.scale.setScalar((i === 0 ? 0.13 : 0.025) * (1 - state.progress * 0.65))
        mesh.material.opacity = state.opacity * 0.85
      })
    }
  })
  return <>
    <group ref={gas} visible={false} renderOrder={10}>
      {Array.from({ length: 24 }, (_, i) => <mesh key={i} geometry={BUBBLE_GEO}>
        <meshBasicMaterial color="#dffaff" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>)}
    </group>
    <group ref={burst} visible={false} renderOrder={11}>
      {Array.from({ length: 22 }, (_, i) => <mesh key={i} geometry={BUBBLE_GEO}>
        <meshBasicMaterial color={i % 3 ? '#ffb347' : '#fff3b0'} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>)}
    </group>
  </>
}
