import * as THREE from 'three';
import { memo, useMemo } from 'react';

type FloorProps = {
  /**
   * Color of the floor
   * @default "#8BC34A" (light green)
   */
  color?: string;

  /**
   * Size of the floor plane
   * @default 2000
   */
  size?: number;

  /**
   * Position of the floor
   * @default [0, -0.1, 0] (slightly below y=0 to prevent z-fighting)
   */
  position?: [number, number, number];

  /**
   * Whether the floor should receive shadows
   * @default true
   */
  receiveShadow?: boolean;

  /**
   * Quality level for the floor's material
   * @default "high"
   */
  quality?: 'low' | 'medium' | 'high';
};

/**
 * A simple floor component that creates a flat ground surface for the game world.
 * By default, uses a light green color to represent grass.
 *
 * This component is memoized to prevent unnecessary re-renders.
 */
const Floor = memo(
  ({
    color = '#8BC34A', // Default to light green
    size = 2000,
    position = [0, -0.1, 0], // Slightly below ground level to prevent z-fighting
    receiveShadow = true,
    quality = 'high',
  }: FloorProps) => {
    // Create memoized material properties based on quality level
    const materialProps = useMemo(() => {
      return {
        roughness: quality === 'low' ? 1.0 : quality === 'medium' ? 0.9 : 0.8,
        metalness: quality === 'low' ? 0.0 : quality === 'medium' ? 0.05 : 0.1,
        flatShading: quality === 'low',
      };
    }, [quality]);

    // Optimize segment count based on quality
    const segments = useMemo(() => {
      return quality === 'low' ? 1 : quality === 'medium' ? 8 : 32;
    }, [quality]);

    return (
      <mesh
        position={position}
        rotation={[-Math.PI / 2, 0, 0]} // Rotate to be flat on XZ plane
        receiveShadow={receiveShadow}
        frustumCulled={true} // Enable frustum culling for performance
      >
        <planeGeometry args={[size, size, segments, segments]} />
        <meshStandardMaterial color={color} {...materialProps} />
      </mesh>
    );
  }
);

Floor.displayName = 'Floor';

export default Floor;
