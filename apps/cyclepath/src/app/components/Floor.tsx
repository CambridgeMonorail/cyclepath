import * as THREE from 'three';

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
};

/**
 * A simple floor component that creates a flat ground surface for the game world.
 * By default, uses a light green color to represent grass.
 */
const Floor = ({
  color = '#8BC34A', // Default to light green
  size = 2000,
  position = [0, -0.1, 0], // Slightly below ground level to prevent z-fighting
  receiveShadow = true,
}: FloorProps) => {
  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]} // Rotate to be flat on XZ plane
      receiveShadow={receiveShadow}
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
    </mesh>
  );
};

export default Floor;
