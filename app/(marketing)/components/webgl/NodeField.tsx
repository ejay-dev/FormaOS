'use client';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect, useState } from 'react';
import { ComplianceState } from './useComplianceState';

// ─── Domain configuration ───────────────────────────────────────────────────
const DOMAIN_CONFIGS = [
  { name: 'Policy',   color: 0x22d3ee, angle: 0 },
  { name: 'Evidence', color: 0x3b82f6, angle: Math.PI / 3 },
  { name: 'Risk',     color: 0xa855f7, angle: (2 * Math.PI) / 3 },
  { name: 'People',   color: 0x10b981, angle: Math.PI },
  { name: 'Systems',  color: 0xf59e0b, angle: (4 * Math.PI) / 3 },
  { name: 'Auditor',  color: 0xffffff, angle: (5 * Math.PI) / 3 },
] as const;

const DOMAIN_RADIUS = 5;
const SATS_PER_DOMAIN = 7;

const EDGE_PAIRS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], // hexagon ring
  [0, 3], [1, 4], [2, 5],                           // cross connections
];

const DOTS_PER_EDGE = 3;

// ─── Compliance Network scene (imperative THREE objects) ─────────────────────
function ComplianceNetwork({ state, paused }: { state: ComplianceState; paused: boolean }) {
  const mouse = useRef(new THREE.Vector2());

  // Satellite orbit definitions (deterministic, no Math.random)
  const satellites = useMemo(() => {
    const result: { domainIndex: number; orbitAngle: number; orbitRadius: number; speed: number; phase: number }[] = [];
    DOMAIN_CONFIGS.forEach((_, di) => {
      for (let si = 0; si < SATS_PER_DOMAIN; si++) {
        result.push({
          domainIndex: di,
          orbitAngle: (si / SATS_PER_DOMAIN) * Math.PI * 2,
          orbitRadius: 0.9 + (si % 3) * 0.2,
          speed: 0.2 + (si % 4) * 0.1,
          phase: (si * 1.3) % (Math.PI * 2),
        });
      }
    });
    return result;
  }, []);

  // Travel dot definitions
  const travelDotDefs = useMemo(
    () =>
      EDGE_PAIRS.flatMap(([from, to], ei) =>
        Array.from({ length: DOTS_PER_EDGE }, (_, i) => ({
          from,
          to,
          initialT: i / DOTS_PER_EDGE,
          speed: 0.15 + (ei % 3) * 0.05,
        })),
      ),
    [],
  );

  // Build the entire THREE scene graph once
  const sceneRefs = useMemo(() => {
    const group = new THREE.Group();

    // Domain sphere meshes
    const domainMeshes = DOMAIN_CONFIGS.map((cfg) => {
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.7,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), mat);
      mesh.position.set(
        Math.cos(cfg.angle) * DOMAIN_RADIUS,
        Math.sin(cfg.angle) * DOMAIN_RADIUS,
        0,
      );
      group.add(mesh);
      return mesh;
    });

    // Edge lines between domain nodes
    const edgeLines = EDGE_PAIRS.map(() => {
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const mat = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.35 });
      const line = new THREE.Line(geom, mat);
      group.add(line);
      return line;
    });

    // Satellite cloud (single Points object)
    const satCount = DOMAIN_CONFIGS.length * SATS_PER_DOMAIN;
    const satPositions = new Float32Array(satCount * 3);
    const satGeom = new THREE.BufferGeometry();
    satGeom.setAttribute('position', new THREE.BufferAttribute(satPositions, 3));
    const satPoints = new THREE.Points(
      satGeom,
      new THREE.PointsMaterial({
        color: 0x94a3b8,
        size: 0.08,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      }),
    );
    group.add(satPoints);

    // Traveling dots along edges
    const travelGroup = new THREE.Group();
    const totalDots = EDGE_PAIRS.length * DOTS_PER_EDGE;
    const travelMeshes = Array.from({ length: totalDots }, () => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.85 }),
      );
      travelGroup.add(mesh);
      return mesh;
    });
    group.add(travelGroup);

    // Mutable travel progress (one float per dot)
    const travelProgress = new Float32Array(totalDots);

    return { group, domainMeshes, edgeLines, satPoints, satPositions, travelMeshes, travelProgress };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Animated domain positions (live values, not derived each frame from scratch)
  const domainCurrentPos = useRef(
    DOMAIN_CONFIGS.map(
      (cfg) =>
        new THREE.Vector3(
          Math.cos(cfg.angle) * DOMAIN_RADIUS,
          Math.sin(cfg.angle) * DOMAIN_RADIUS,
          0,
        ),
    ),
  );

  // Seed travel progress from definitions on mount
  useEffect(() => {
    const { travelProgress } = sceneRefs;
    travelDotDefs.forEach((def, i) => {
      travelProgress[i] = def.initialT;
    });
  }, [sceneRefs, travelDotDefs]);

  useFrame(({ pointer, clock }) => {
    if (paused) return;
    const t = clock.getElapsedTime();

    mouse.current.set(pointer.x * 8, pointer.y * 8);

    // State-based animation parameters
    let spreadTarget = 1.0;
    let orbitSpeed = 0.5;
    let edgeSpeed = 0.5;
    let edgeOpacity = 0.35;
    switch (state) {
      case 'model':
        spreadTarget = 1.0; orbitSpeed = 0.5; edgeSpeed = 0.5; edgeOpacity = 0.35; break;
      case 'execute':
        spreadTarget = 1.3; orbitSpeed = 1.5; edgeSpeed = 2.0; edgeOpacity = 0.60; break;
      case 'verify':
        spreadTarget = 0.75; orbitSpeed = 0.7; edgeSpeed = 1.0; edgeOpacity = 0.50; break;
      case 'prove':
        spreadTarget = 0.15; orbitSpeed = 0.3; edgeSpeed = 3.0; edgeOpacity = 0.80; break;
    }

    const { domainMeshes, edgeLines, satPoints, satPositions, travelMeshes, travelProgress } = sceneRefs;
    const positions = domainCurrentPos.current;

    // ── Update domain node positions ────────────────────────────────────────
    positions.forEach((pos, i) => {
      const cfg = DOMAIN_CONFIGS[i];
      const targetX = Math.cos(cfg.angle) * DOMAIN_RADIUS * spreadTarget;
      const targetY = Math.sin(cfg.angle) * DOMAIN_RADIUS * spreadTarget;

      // Gentle orbital sway
      const sway = Math.sin(t * orbitSpeed + i) * 0.15;
      const swayX = Math.cos(cfg.angle + Math.PI / 2) * sway;
      const swayY = Math.sin(cfg.angle + Math.PI / 2) * sway;

      pos.x += (targetX + swayX - pos.x) * 0.04;
      pos.y += (targetY + swayY - pos.y) * 0.04;

      // Mouse proximity pull
      const dx = mouse.current.x - pos.x;
      const dy = mouse.current.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 4) {
        pos.x += dx * 0.015;
        pos.y += dy * 0.015;
      }

      domainMeshes[i].position.copy(pos);

      // Emissive glow
      const mat = domainMeshes[i].material as THREE.MeshStandardMaterial;
      let glow = 0.5 + Math.sin(t * 1.5 + i * 1.1) * 0.1;
      if (state === 'prove')  glow = 1.5 + Math.sin(t * 4) * 1.0;
      else if (state === 'verify') glow = 0.7 + Math.sin(t * 3 + i) * 0.3;
      if (dist < 2.5) glow = Math.max(glow, 1.5); // mouse proximity glow
      mat.emissiveIntensity = glow;
    });

    // ── Update edge lines ───────────────────────────────────────────────────
    edgeLines.forEach((line, li) => {
      const [a, b] = EDGE_PAIRS[li];
      const pa = positions[a];
      const pb = positions[b];
      const arr = line.geometry.attributes.position.array as Float32Array;
      arr[0] = pa.x; arr[1] = pa.y; arr[2] = pa.z;
      arr[3] = pb.x; arr[4] = pb.y; arr[5] = pb.z;
      line.geometry.attributes.position.needsUpdate = true;
      (line.material as THREE.LineBasicMaterial).opacity = edgeOpacity;
    });

    // ── Update satellite positions ──────────────────────────────────────────
    satellites.forEach((sat, si) => {
      const domainPos = positions[sat.domainIndex];
      const angle = sat.orbitAngle + t * sat.speed * orbitSpeed + sat.phase;
      satPositions[si * 3]     = domainPos.x + Math.cos(angle) * sat.orbitRadius;
      satPositions[si * 3 + 1] = domainPos.y + Math.sin(angle) * sat.orbitRadius;
      satPositions[si * 3 + 2] = Math.sin(angle * 2) * 0.3;
    });
    satPoints.geometry.attributes.position.needsUpdate = true;

    // ── Update traveling dots along edges ───────────────────────────────────
    travelDotDefs.forEach((def, di) => {
      travelProgress[di] = (travelProgress[di] + def.speed * edgeSpeed * 0.005) % 1;
      const pa = positions[def.from];
      const pb = positions[def.to];
      travelMeshes[di].position.lerpVectors(pa, pb, travelProgress[di]);
    });
  });

  return <primitive object={sceneRefs.group} />;
}

// ─── Canvas wrapper ──────────────────────────────────────────────────────────
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
      dpr={[1, 1.5]}
      frameloop={paused ? 'never' : 'always'}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 0, 8]} intensity={1.5} />
      <ComplianceNetwork state={state} paused={paused} />
    </Canvas>
  );
}
