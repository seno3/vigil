/**
 * Vertical alignment for the 3D scene.
 *
 * `TerrainGround` displaces vertices by up to ~9.5m (rolling hills) with the mesh at y = -0.2,
 * so the terrain surface spans roughly y ∈ [-9.7, 9.3] in world space.
 * Flat geometry (water ribbons, roads, building bases) must sit *above* the highest hill or it
 * renders underground.
 */
export const TERRAIN_MESH_Y = -0.2;
export const TERRAIN_DISPLACEMENT_MAX = 9.5;

/** Roads, building bases, path overlays, tornado ground contact */
export const FLAT_SURFACE_Y = TERRAIN_MESH_Y + TERRAIN_DISPLACEMENT_MAX + 0.35;

/** Slightly above {@link FLAT_SURFACE_Y} so road ribbons clear displaced terrain without polygonOffset burying them. */
export const ROAD_SURFACE_Y = FLAT_SURFACE_Y + 0.12;

/** Water planes sit a hair lower than roads to reduce z-fighting; still above terrain peaks */
export const WATER_SURFACE_Y = FLAT_SURFACE_Y - 0.06;

/** Max orbit distance so users rarely see the outer gray ring edge (with fog) */
export const ORBIT_MAX_DISTANCE = 4200;
