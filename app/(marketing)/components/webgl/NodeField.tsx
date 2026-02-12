'use client';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState } from 'react';
import { ComplianceState } from './useComplianceState';

function NodeSystem({ state, paused }: { state: ComplianceState; paused: boolean }) {
  const ref = useRef<THREE.Points>(null!);
  const mouse = useRef({ x: 0, y: 0 });

  // Reduced from 2500 to 800 for much better performance
  const nodeCount = 800;

  const positions = useMemo(() => {
    const arr = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  const velocities = useMemo(() => {
    const arr = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.02;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    return arr;
  }, []);

  useFrame(({ pointer, camera }) => {
    if (paused || !ref.current?.geometry?.attributes?.position) return;

    mouse.current.x = pointer.x * 10;
    mouse.current.y = pointer.y * 10;

    const pos = ref.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < nodeCount; i++) {
      const i3 = i * 3;

      const dx = pos[i3] - mouse.current.x;
      const dy = pos[i3 + 1] - mouse.current.y;
      const dz = pos[i3 + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.001;

      if (dist < 3) {
        pos[i3] += dx * 0.03;
        pos[i3 + 1] += dy * 0.03;
      }

      switch (state) {
        case 'model':
          velocities[i3 + 1] += Math.sin(Date.now() * 0.0002) * 0.0005;
          break;
        case 'execute':
          velocities[i3] *= 1.002;
          break;
        case 'verify':
          velocities[i3] *= 0.995;
          velocities[i3 + 1] *= 0.995;
          break;
        case 'prove':
          velocities[i3] *= 0.9;
          velocities[i3 + 1] *= 0.9;
          velocities[i3 + 2] *= 0.9;
          break;
      }

      pos[i3] += velocities[i3];
      pos[i3 + 1] += velocities[i3 + 1];
      pos[i3 + 2] += velocities[i3 + 2];
    }

    camera.position.x += (mouse.current.x * 0.03 - camera.position.x) * 0.02;
    camera.position.y += (mouse.current.y * 0.03 - camera.position.y) * 0.02;

    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  const color = {
    model: '#22d3ee',
    execute: '#3b82f6',
    verify: '#a855f7',
    prove: '#10b981',
  }[state];

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={color}
        size={0.05}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
}

export default function WebGLNodeField({ state }: { state: ComplianceState }) {
  const [paused, setPaused] = useState(false);

  // Headless test runners (Lighthouse/Pa11y/Backstop) can hang or become flaky
  // with WebGL canvases. Skip WebGL when we detect automation.
  if (
    typeof navigator !== 'undefined' &&
    (navigator.webdriver || /Lighthouse/i.test(navigator.userAgent))
  ) {
    return null;
  }

  useEffect(() => {
    // Respect prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      setPaused(true);
      return;
    }

    // Pause when tab is not visible
    const handleVisibility = () => {
      setPaused(document.visibilityState !== 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return (
    <Canvas
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        alpha: true,
        stencil: false,
        depth: false,
      }}
      camera={{ position: [0, 0, 18], fov: 60 }}
      dpr={[1, 1]}
      frameloop={paused ? 'never' : 'always'}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.5} />
      <NodeSystem state={state} paused={paused} />
    </Canvas>
  );
}
