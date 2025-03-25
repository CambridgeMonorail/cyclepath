import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Position = {
  x: number;
  z: number;
};

type ObstaclesGeneratorProps = {
  count: number;
  range: number;
  playerPosition: Position;
  onCollision: () => void;
};

export const ObstaclesGenerator = ({
  count,
  range,
  playerPosition,
  onCollision,
}: ObstaclesGeneratorProps) => {
  const obstaclesRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    // Check for collisions
    obstaclesRef.current.forEach((obstacle) => {
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - obstacle.position.x, 2) +
        Math.pow(playerPosition.z - obstacle.position.z, 2)
      );

      if (distance < 1) {
        onCollision();
      }
    });
  }, [playerPosition, onCollision]);

  // Generate random positions for obstacles
  const obstacles = Array.from({ length: count }, (_, i) => {
    const x = (Math.random() - 0.5) * range;
    const z = (Math.random() - 0.5) * range;
    return (
      <mesh
        key={i}
        ref={(el) => {
          if (el) obstaclesRef.current[i] = el;
        }}
        position={[x, 0.5, z]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#650D89" /> {/* teal from palette */}
      </mesh>
    );
  });

  return <>{obstacles}</>;
};

export default ObstaclesGenerator;
