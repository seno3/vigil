'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { TownModel, AgentOutput, DamageLevel, PathSegment, EvacuationRoute, Label } from '@/types';
import Buildings from './Buildings';
import TornadoVis from './TornadoVis';
import EvacRoutes from './EvacRoutes';
import Labels3D from './Labels3D';

interface Scene3DProps {
  townModel: TownModel;
  agentOutputs: Partial<Record<AgentOutput['agent'], AgentOutput>>;
}

function SceneContent({ townModel, agentOutputs }: Scene3DProps) {
  const { lat: centerLat, lng: centerLng } = townModel.center;

  const damageLevels = useMemo<Record<string, DamageLevel>>(() => {
    const structural = agentOutputs['structural'];
    if (!structural?.data.damage_levels) return {};
    return structural.data.damage_levels;
  }, [agentOutputs]);

  const pathSegments = useMemo<PathSegment[]>(() => {
    const path = agentOutputs['path'];
    if (!path?.data.path_segments) return [];
    return path.data.path_segments;
  }, [agentOutputs]);

  const evacuationRoutes = useMemo<EvacuationRoute[]>(() => {
    const evac = agentOutputs['evacuation'];
    if (!evac?.data.evacuation_routes) return [];
    return evac.data.evacuation_routes;
  }, [agentOutputs]);

  const blockedRoads = useMemo<string[]>(() => {
    const structural = agentOutputs['structural'];
    const evac = agentOutputs['evacuation'];
    return [
      ...(structural?.data.blocked_roads ?? []),
      ...(evac?.data.blocked_roads ?? []),
    ];
  }, [agentOutputs]);

  const allLabels = useMemo<Label[]>(() => {
    const labels: Label[] = [];
    for (const output of Object.values(agentOutputs)) {
      if (output?.data.labels) labels.push(...output.data.labels);
    }
    return labels;
  }, [agentOutputs]);

  return (
    <>
      {/* Atmosphere */}
      <fog attach="fog" args={['#0a0e17', 800, 3000]} />
      <color attach="background" args={['#0a0e17']} />

      {/* Lighting — stormy overcast */}
      <ambientLight intensity={0.25} color="#334466" />
      <directionalLight
        position={[200, 600, 200]}
        intensity={0.8}
        color="#aabbcc"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-300, 200, -300]} intensity={0.3} color="#ff6b2b" />

      {/* Stars overhead for atmosphere */}
      <Stars radius={2000} depth={50} count={1000} factor={2} saturation={0} fade speed={0.5} />

      {/* Ground grid */}
      <Grid
        args={[2000, 2000]}
        cellSize={50}
        cellThickness={0.3}
        cellColor="#1e2a3a"
        sectionSize={200}
        sectionThickness={0.8}
        sectionColor="#2a3a50"
        fadeDistance={2000}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[3000, 3000]} />
        <meshStandardMaterial color="#0d1420" roughness={1} />
      </mesh>

      {/* Buildings */}
      <Buildings
        buildings={townModel.buildings}
        damageLevels={damageLevels}
        centerLat={centerLat}
        centerLng={centerLng}
      />

      {/* Tornado path + funnel */}
      {pathSegments.length > 0 && (
        <TornadoVis
          pathSegments={pathSegments}
          centerLat={centerLat}
          centerLng={centerLng}
        />
      )}

      {/* Evacuation routes */}
      {(evacuationRoutes.length > 0 || blockedRoads.length > 0) && (
        <EvacRoutes
          roads={townModel.roads}
          evacuationRoutes={evacuationRoutes}
          blockedRoads={blockedRoads}
          infrastructure={townModel.infrastructure}
          centerLat={centerLat}
          centerLng={centerLng}
        />
      )}

      {/* Labels */}
      {allLabels.length > 0 && (
        <Labels3D labels={allLabels} centerLat={centerLat} centerLng={centerLng} />
      )}
    </>
  );
}

export default function Scene3D({ townModel, agentOutputs }: Scene3DProps) {
  return (
    <Canvas
      shadows
      camera={{
        position: [0, 800, 600],
        fov: 45,
        near: 1,
        far: 8000,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.8,
      }}
      style={{ background: '#0a0e17' }}
    >
      <Suspense fallback={null}>
        <SceneContent townModel={townModel} agentOutputs={agentOutputs} />
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        minDistance={100}
        maxDistance={3000}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
