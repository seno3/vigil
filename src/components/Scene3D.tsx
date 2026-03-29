'use client';

import {
  Suspense,
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { setOptions, importLibrary, type APIOptions } from '@googlemaps/js-api-loader';
import {
  TownModel,
  AgentOutput,
  DamageLevel,
  PathSegment,
  EvacuationRoute,
  Label,
} from '@/types';
import { latLngToLocal, distanceMeters } from '@/lib/geo';
import Buildings from './Buildings';
import TornadoVis from './TornadoVis';
import EvacRoutes from './EvacRoutes';
import Labels3D from './Labels3D';
import TimeSlider from './TimeSlider';

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAYBACK_DURATION = 20; // seconds to traverse full path

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Approximate compass bearing (degrees from north) from point A to point B */
function computeHeading(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat2 - lat1;
  const dLng = (lng2 - lng1) * Math.cos((lat1 * Math.PI) / 180);
  return (Math.atan2(dLng, dLat) * 180) / Math.PI;
}

// ─── Public props ─────────────────────────────────────────────────────────────
interface Scene3DProps {
  townModel: TownModel;
  agentOutputs: Partial<Record<AgentOutput['agent'], AgentOutput>>;
  onPositionUpdate?: (lat: number, lng: number) => void;
}

// ─── SceneContent props ───────────────────────────────────────────────────────
interface SceneContentProps extends Scene3DProps {
  timeProgress: number;
  isPlaying: boolean;
  onProgressChange: (p: number) => void;
  onPlayingChange: (playing: boolean) => void;
}

// ─── Pulsing waypoint for the "current" segment position ─────────────────────
function PulsingWaypoint({
  x,
  z,
  geom,
}: {
  x: number;
  z: number;
  geom: THREE.BufferGeometry;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.getElapsedTime() * 5) * 0.35;
    ref.current.scale.set(s, 1, s);
  });

  return (
    <mesh ref={ref} geometry={geom} position={[x, 0.5, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="white" transparent opacity={0.9} depthWrite={false} />
    </mesh>
  );
}

// ─── Waypoint dots along the path ────────────────────────────────────────────
function WaypointDots({
  pathSegments,
  currentSegIdx,
  centerLat,
  centerLng,
}: {
  pathSegments: PathSegment[];
  currentSegIdx: number;
  centerLat: number;
  centerLng: number;
}) {
  const discGeom = useMemo(() => new THREE.CylinderGeometry(8, 8, 0.5, 16), []);

  const positions = useMemo(
    () =>
      pathSegments.map((seg) =>
        latLngToLocal(seg.lat, seg.lng, centerLat, centerLng),
      ),
    [pathSegments, centerLat, centerLng],
  );

  return (
    <>
      {positions.map(([x, z], i) => {
        if (i === currentSegIdx) {
          return <PulsingWaypoint key={i} x={x} z={z} geom={discGeom} />;
        }
        const ahead = i > currentSegIdx;
        return (
          <mesh
            key={i}
            geometry={discGeom}
            position={[x, 0.5, z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <meshStandardMaterial
              color={ahead ? '#2a3a50' : '#ef4444'}
              transparent
              opacity={ahead ? 0.3 : 0.6}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </>
  );
}

// ─── SceneContent (runs inside Canvas — transparent, street-level) ────────────
function SceneContent({
  townModel,
  agentOutputs,
  timeProgress,
  isPlaying,
  onProgressChange,
  onPlayingChange,
}: SceneContentProps) {
  const { lat: centerLat, lng: centerLng } = townModel.center;

  // Refs keep useFrame closure fresh between React renders
  const progressRef  = useRef(timeProgress);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { progressRef.current  = timeProgress; }, [timeProgress]);
  useEffect(() => { isPlayingRef.current = isPlaying;    }, [isPlaying]);

  // ── Derive agent data ──────────────────────────────────────────────────────
  const damageLevels = useMemo<Record<string, DamageLevel>>(() => {
    const structural = agentOutputs['structural'];
    if (!structural?.data.damage_levels) return {};
    return structural.data.damage_levels;
  }, [agentOutputs]);

  const pathSegments = useMemo<PathSegment[]>(() => {
    return agentOutputs['path']?.data.path_segments ?? [];
  }, [agentOutputs]);

  const evacuationRoutes = useMemo<EvacuationRoute[]>(() => {
    return agentOutputs['evacuation']?.data.evacuation_routes ?? [];
  }, [agentOutputs]);

  const blockedRoads = useMemo<string[]>(() => {
    return [
      ...(agentOutputs['structural']?.data.blocked_roads ?? []),
      ...(agentOutputs['evacuation']?.data.blocked_roads ?? []),
    ];
  }, [agentOutputs]);

  const allLabels = useMemo<Label[]>(() => {
    const labels: Label[] = [];
    for (const output of Object.values(agentOutputs)) {
      if (output?.data.labels) labels.push(...output.data.labels);
    }
    return labels;
  }, [agentOutputs]);

  // ── Auto-start when path data first arrives ────────────────────────────────
  const prevPathLen = useRef(0);
  useEffect(() => {
    if (pathSegments.length > 0 && prevPathLen.current === 0) {
      onPlayingChange(true);
    }
    prevPathLen.current = pathSegments.length;
  }, [pathSegments.length, onPlayingChange]);

  // ── Animation loop ─────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!isPlayingRef.current) return;
    const p = progressRef.current;
    if (p >= 1) return;
    const next = Math.min(p + delta / PLAYBACK_DURATION, 1);
    progressRef.current = next;
    onProgressChange(next);
    if (next >= 1) onPlayingChange(false);
  });

  // ── Interpolated tornado position ──────────────────────────────────────────
  const {
    currentLat,
    currentLng,
    currentWidth,
    currentWind,
    currentSegIdx,
  } = useMemo(() => {
    if (pathSegments.length === 0) {
      return { currentLat: 0, currentLng: 0, currentWidth: 100, currentWind: 0, currentSegIdx: 0 };
    }
    const segIdx = timeProgress * (pathSegments.length - 1);
    const i      = Math.floor(segIdx);
    const t      = segIdx - i;
    const segA   = pathSegments[i];
    const segB   = pathSegments[Math.min(i + 1, pathSegments.length - 1)];
    return {
      currentLat:   lerp(segA.lat,            segB.lat,            t),
      currentLng:   lerp(segA.lng,            segB.lng,            t),
      currentWidth: lerp(segA.width_m,        segB.width_m,        t),
      currentWind:  lerp(segA.wind_speed_mph, segB.wind_speed_mph, t),
      currentSegIdx: i,
    };
  }, [timeProgress, pathSegments]);

  // ── Damage reveal: only show damage for buildings the tornado has passed ───
  const filteredDamageLevels = useMemo<Record<string, DamageLevel>>(() => {
    if (pathSegments.length === 0) return damageLevels;
    const result: Record<string, DamageLevel> = {};
    for (const building of townModel.buildings) {
      const level = damageLevels[building.id];
      if (!level) continue;
      let hit = false;
      for (let si = 0; si <= currentSegIdx && si < pathSegments.length; si++) {
        const seg  = pathSegments[si];
        const dist = distanceMeters(
          seg.lat, seg.lng,
          building.centroid.lat, building.centroid.lng,
        );
        if (dist < seg.width_m / 2) {
          hit = true;
          break;
        }
      }
      result[building.id] = hit ? level : 'intact';
    }
    return result;
  }, [currentSegIdx, damageLevels, townModel.buildings, pathSegments]);

  // ── Path line geometry ─────────────────────────────────────────────────────
  const elapsedLine = useMemo(() => {
    if (pathSegments.length < 2) return null;
    const pts = pathSegments
      .slice(0, currentSegIdx + 2)
      .map((seg) => {
        const [x, z] = latLngToLocal(seg.lat, seg.lng, centerLat, centerLng);
        return new THREE.Vector3(x, 1, z);
      });
    if (pts.length < 2) return null;
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat  = new THREE.LineBasicMaterial({ color: '#ef4444', linewidth: 2 });
    return new THREE.Line(geom, mat);
  }, [currentSegIdx, pathSegments, centerLat, centerLng]);

  const remainingLine = useMemo(() => {
    if (pathSegments.length < 2) return null;
    const pts = pathSegments
      .slice(Math.max(0, currentSegIdx))
      .map((seg) => {
        const [x, z] = latLngToLocal(seg.lat, seg.lng, centerLat, centerLng);
        return new THREE.Vector3(x, 1, z);
      });
    if (pts.length < 2) return null;
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat  = new THREE.LineBasicMaterial({ color: '#2a3a50', linewidth: 1 });
    return new THREE.Line(geom, mat);
  }, [currentSegIdx, pathSegments, centerLat, centerLng]);

  return (
    <>
      {/* Lighting — overcast street-level, works on transparent bg */}
      <ambientLight intensity={0.4} color="#334466" />
      <directionalLight
        position={[200, 600, 200]}
        intensity={0.5}
        color="#aabbcc"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      {/* Warm backlight — tornado glow from behind */}
      <directionalLight position={[-300, 200, -300]} intensity={0.3} color="#ff6b2b" />
      {/* Sickly pre-tornado sky tint */}
      <directionalLight position={[0, 800, 0]} intensity={0.35} color="#b8d444" />

      {/* Buildings — transparent damage overlays only */}
      <Buildings
        buildings={townModel.buildings}
        damageLevels={filteredDamageLevels}
        centerLat={centerLat}
        centerLng={centerLng}
      />

      {/* Path lines: elapsed (red) + remaining (dim) */}
      {elapsedLine   && <primitive object={elapsedLine}   />}
      {remainingLine && <primitive object={remainingLine} />}

      {/* Waypoint dots at each segment position */}
      {pathSegments.length > 0 && (
        <WaypointDots
          pathSegments={pathSegments}
          currentSegIdx={currentSegIdx}
          centerLat={centerLat}
          centerLng={centerLng}
        />
      )}

      {/* Tornado funnel at interpolated position */}
      {pathSegments.length > 0 && (
        <TornadoVis
          lat={currentLat}
          lng={currentLng}
          width_m={currentWidth}
          wind_speed_mph={currentWind}
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

// ─── Scene3D — state owner, two-layer compositor ──────────────────────────────
export default function Scene3D({ townModel, agentOutputs, onPositionUpdate }: Scene3DProps) {
  const [timeProgress, setTimeProgress] = useState(0);
  const [isPlaying,    setIsPlaying]    = useState(false);

  // ── Street View layer ──────────────────────────────────────────────────────
  const svContainerRef = useRef<HTMLDivElement>(null);
  const panoramaRef    = useRef<google.maps.StreetViewPanorama | null>(null);
  const svFailedRef    = useRef(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      svFailedRef.current = true;
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const opts: APIOptions = { key: apiKey, v: 'weekly' };
        setOptions(opts);

        const streetViewLib = await importLibrary('streetView') as typeof google.maps;
        const { StreetViewPanorama, StreetViewService, StreetViewStatus } = streetViewLib;

        if (cancelled || !svContainerRef.current) return;

        const { lat, lng } = townModel.center;
        const sv = new StreetViewService();

        sv.getPanorama(
          { location: { lat, lng }, radius: 200 },
          (
            _data: google.maps.StreetViewPanoramaData | null,
            status: google.maps.StreetViewStatus,
          ) => {
            if (cancelled || !svContainerRef.current) return;
            if (status !== StreetViewStatus.OK) {
              svFailedRef.current = true;
              return;
            }
            panoramaRef.current = new StreetViewPanorama(svContainerRef.current!, {
              position:              { lat, lng },
              pov:                   { heading: 45, pitch: 5 },
              zoom:                  1,
              addressControl:        false,
              showRoadLabels:        false,
              zoomControl:           false,
              fullscreenControl:     false,
              motionTracking:        false,
              motionTrackingControl: false,
            });
          },
        );
      } catch {
        if (!cancelled) svFailedRef.current = true;
      }
    })();

    return () => { cancelled = true; };
  // Only initialize once on mount for the town center
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Path segment data (used both for position update & SV tracking) ────────
  const pathSegments = useMemo<PathSegment[]>(
    () => agentOutputs['path']?.data.path_segments ?? [],
    [agentOutputs],
  );

  // ── Update Street View + notify parent when tornado segment changes ─────────
  const prevSegIdxRef = useRef(-1);
  useEffect(() => {
    if (pathSegments.length === 0) return;
    const segIdx = Math.floor(timeProgress * (pathSegments.length - 1));
    if (segIdx === prevSegIdxRef.current) return;
    prevSegIdxRef.current = segIdx;

    const seg = pathSegments[segIdx];
    if (!seg) return;

    // Notify parent (feeds Dashboard Street View panel)
    if (onPositionUpdate) onPositionUpdate(seg.lat, seg.lng);

    // Pan Street View toward tornado
    if (panoramaRef.current) {
      panoramaRef.current.setPosition({ lat: seg.lat, lng: seg.lng });
      const nextSeg = pathSegments[Math.min(segIdx + 1, pathSegments.length - 1)];
      if (nextSeg) {
        const heading = computeHeading(seg.lat, seg.lng, nextSeg.lat, nextSeg.lng);
        panoramaRef.current.setPov({ heading, pitch: 5 });
      }
    }
  }, [timeProgress, pathSegments, onPositionUpdate]);

  // ── Atmospheric overlay opacity — peaks when tornado is overhead ──────────
  const darknessOpacity = Math.sin(Math.PI * timeProgress) * 0.55;
  const redOpacity      = Math.max(0, Math.sin(Math.PI * timeProgress) - 0.6) * 0.25;

  const handleProgressChange = useCallback((p: number) => {
    setTimeProgress(p);
    setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(
    () => setIsPlaying((v) => !v),
    [],
  );

  const sceneHeight = pathSegments.length > 0 ? 'calc(100% - 72px)' : '100%';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0a0e17' }}>

      {/* Layer 1 — Google Street View background */}
      <div
        ref={svContainerRef}
        style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%',
          height: sceneHeight,
          zIndex: 0,
          background: 'linear-gradient(to bottom, #0a0e17 0%, #1a0508 100%)',
        }}
      />

      {/* Darkness overlay — intensifies as tornado approaches */}
      {darknessOpacity > 0.01 && (
        <div
          style={{
            position:      'absolute',
            top: 0, left: 0, width: '100%',
            height:        sceneHeight,
            zIndex:        1,
            background:    `rgba(20,10,5,${darknessOpacity.toFixed(3)})`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Red tint — tornado peak */}
      {redOpacity > 0.01 && (
        <div
          style={{
            position:      'absolute',
            top: 0, left: 0, width: '100%',
            height:        sceneHeight,
            zIndex:        1,
            background:    `rgba(180,30,10,${redOpacity.toFixed(3)})`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Layer 2 — Three.js transparent canvas */}
      <Canvas
        shadows
        camera={{
          position: [0, 8, 40],
          fov: 65,
          near: 0.5,
          far: 6000,
        }}
        gl={{
          alpha:              true,
          antialias:          true,
          toneMapping:        THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.8,
        }}
        style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%',
          height: sceneHeight,
          zIndex: 2,
        }}
      >
        <Suspense fallback={null}>
          <SceneContent
            townModel={townModel}
            agentOutputs={agentOutputs}
            timeProgress={timeProgress}
            isPlaying={isPlaying}
            onProgressChange={setTimeProgress}
            onPlayingChange={setIsPlaying}
          />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          minDistance={5}
          maxDistance={2000}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 30, 0]}
        />
      </Canvas>

      {pathSegments.length > 0 && (
        <TimeSlider
          timeProgress={timeProgress}
          isPlaying={isPlaying}
          pathSegments={pathSegments}
          playbackDuration={PLAYBACK_DURATION}
          onProgressChange={handleProgressChange}
          onPlayPause={handlePlayPause}
        />
      )}
    </div>
  );
}
