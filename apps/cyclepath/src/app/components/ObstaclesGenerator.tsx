import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type ObstacleProps = {
  position: [number, number, number];
  scale?: [number, number, number];
  color?: string;
};

const Obstacle = ({ position, scale = [1, 1, 1], color = "#4d4d4d" }: ObstacleProps) => {
  return (
    <mesh position={position}>
      <boxGeometry args={scale} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

type ObstaclesGeneratorProps = {
  count?: number;
  range?: number;
  playerPosition: { x: number, z: number };
  onCollision?: () => void;
};

export const ObstaclesGenerator = ({
  count = 10,
  range = 20,
  playerPosition,
  onCollision
}: ObstaclesGeneratorProps) => {
  // Create a ref to hold obstacle positions
  const obstaclesRef = useRef<THREE.Object3D>(null);
  const obstaclePositions = useRef<Array<[number, number, number]>>([]);

  // Generate random obstacle positions if not already generated
  if (obstaclePositions.current.length === 0) {
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * range;
      const z = (Math.random() - 0.5) * range;
      obstaclePositions.current.push([x, 0.5, z]);
    }
  }

  // Check for collisions with the player
  useFrame(() => {
    if (onCollision) {
      // Simple collision detection based on distance
      const playerPos = new THREE.Vector3(playerPosition.x, 0.5, playerPosition.z);
      const collisionThreshold = 1.2; // Adjust based on player and obstacle size

      for (const position of obstaclePositions.current) {
        const obstaclePos = new THREE.Vector3(position[0], position[1], position[2]);
        const distance = playerPos.distanceTo(obstaclePos);

        if (distance < collisionThreshold) {
          onCollision();
          break;
        }
      }
    }
  });

  return (
    <group ref={obstaclesRef}>
      {obstaclePositions.current.map((position, index) => (
        <Obstacle key={index} position={position} />
      ))}
    </group>
  );
};

export default ObstaclesGenerator;
