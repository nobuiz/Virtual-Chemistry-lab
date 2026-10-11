import { useCallback, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Vector3 } from 'three'
import LabScene from './LabScene'
import {
  BEAKER_MOUTH,
  BOTTLE_SIZE,
  CAMERA,
  CARRY_Z,
  SLOTS,
  SOLID_SIZE,
} from '../../lib/lab3d/layout'

import { createHitTester } from '../../lib/lab3d/raycast'

/**
 * The 3D laboratory viewport.
 *
 * RESPONSIBILITIES (and, just as importantly, what it does NOT do):
 *
 *   - owns the <Canvas>, the camera and the hit-tester;
 *   - forwards raw mouse events to App.jsx's existing pointer primitives, so
 *     the mouse fallback is the SAME code path as before, just hit-testing
 *     against 3D geometry instead of DOM nodes;
 *   - keeps the carried object's world position in a ref that the scene reads
 *     inside useFrame.
 *
 * It owns NO interaction state. Phases, grabbing, the pour transaction and the
 * chemistry all remain in App.jsx exactly as they were, which is why hand
 * tracking keeps working here with no changes to the tracking hook.
 */
export default function Lab3D({
  hitTestRef,
  pourRef,
  hoveredId,
  carriedId,
  fillLevel,
  liquidColor,
  effects,
  solids,
  dropActive,
}) {
  const hostRef = useRef(null)
  /** { camera, canvas } published from inside the Canvas. */
  const viewRef = useRef(null)
  /** Live world position of the carried reagent, read by the scene's useFrame. */
  const carryRef = useRef(new Vector3(0, 1.4, CARRY_Z))

  /** Canvas rect, cached and refreshed on resize/scroll rather than per event. */
  const rectRef = useRef(null)
  const readRect = useCallback(() => {
    const el = hostRef.current
    if (!el) return null
    // getBoundingClientRect forces layout; cache it and invalidate on resize.
    if (!rectRef.current) rectRef.current = el.getBoundingClientRect()
    return rectRef.current
  }, [])

  useEffect(() => {
    const invalidate = () => {
      rectRef.current = null
    }
    window.addEventListener('resize', invalidate)
    window.addEventListener('scroll', invalidate, true)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(invalidate) : null
    if (ro && hostRef.current) ro.observe(hostRef.current)
    return () => {
      window.removeEventListener('resize', invalidate)
      window.removeEventListener('scroll', invalidate, true)
      ro?.disconnect()
    }
  }, [])

  /**
   * The hit-tester, built once and published upward for the state machine.
   *
   * Built in an effect, not in render: it closes over refs, and the state
   * machine only ever calls it from event handlers. `track` is bundled into
   * the same object so App has a single handle for "tell the 3D view where
   * the cursor is", regardless of input source.
   */
  useEffect(() => {
    if (!hitTestRef) return undefined
    const tester = createHitTester(() => viewRef.current?.camera ?? null, readRect)
    tester.track = (x, y) => {
      tester.carryPoint(x, y, carryRef.current)
    }
    hitTestRef.current = tester
    return () => {
      // Hand the state machine back nothing on unmount, so a late pointer
      // event cannot raycast against a disposed camera.
      if (hitTestRef.current === tester) hitTestRef.current = null
    }
  }, [hitTestRef, readRect])

  /**
   * DEV/QA PROBE.
   *
   * Playwright cannot see into a WebGL canvas, so it cannot find the zinc
   * ingot the way it finds a DOM card. This exposes the inverse of the
   * hit-tester — world -> screen — letting the automated suites drive the
   * REAL pointer path at the REAL pixel a reagent occupies, rather than
   * reaching behind the UI to call state setters.
   *
   * Stripped from production builds by `import.meta.env.DEV`.
   */
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined
    const project = (v) => {
      const camera = viewRef.current?.camera
      const rect = readRect()
      if (!camera || !rect) return null
      const p = v.clone().project(camera)
      return {
        x: rect.left + ((p.x + 1) / 2) * rect.width,
        y: rect.top + ((1 - p.y) / 2) * rect.height,
      }
    }
    window.__gl_lab3d = {
      /** Screen position of a reagent on the shelf. */
      slot: (id) => {
        const s = SLOTS[id]
        if (!s) return null
        const size = s.kind === 'liquid' ? BOTTLE_SIZE : SOLID_SIZE
        return project(new Vector3(s.x, s.y + size.hy, s.z))
      },
      /** Screen position of the beaker mouth — the drop target. */
      beaker: () => project(BEAKER_MOUTH.clone()),
      /** Live world position of whatever is being carried. */
      carry: () => carryRef.current.toArray(),
      ids: Object.keys(SLOTS),
    }
    return () => {
      delete window.__gl_lab3d
    }
  }, [readRect])
  return (
    <div ref={hostRef} data-testid="lab3d-viewport"
      className="relative h-full w-full overflow-hidden rounded-2xl"
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{
          position: CAMERA.position,
          fov: CAMERA.fov,
          near: CAMERA.near,
          far: CAMERA.far,
        }}
        onCreated={({ camera }) => {
          // Eye-level, angled slightly down at the bench — set once here
          // rather than with OrbitControls, because the camera is fixed:
          // a first-person lab should not be orbitable by accident.
          camera.lookAt(...CAMERA.target)
          camera.updateProjectionMatrix()
        }}
      >
        <color attach="background" args={['#20242d']} />
        <LabScene
          viewRef={viewRef}
          carryRef={carryRef}
          pourRef={pourRef}
          hoveredId={hoveredId}
          carriedId={carriedId}
          fillLevel={fillLevel}
          liquidColor={liquidColor}
          effects={effects}
          solids={solids}
          dropActive={dropActive}
        />
      </Canvas>
    </div>
  )
}

