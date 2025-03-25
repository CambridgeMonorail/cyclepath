import { useRef, useEffect } from 'react';
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

type ObstaclePosition = {
  x: number;
  z: number;
};

const generatePositions = (count: number, range: number): ObstaclePosition[] => {
  return Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * range,
    z: (Math.random() - 0.5) * range,
  }));
};

export const ObstaclesGenerator = ({
  count,
  range,
  playerPosition,
  onCollision,
}: ObstaclesGeneratorProps) => {
  const obstaclesRef = useRef<THREE.Mesh[]>([]);
  const obstaclePositionsRef = useRef<ObstaclePosition[]>(generatePositions(count, range));

  useEffect(() => {
    // Check for collisions
    obstaclesRef.current.forEach((obstacle, index) => {
      if (!obstacle) return;

      const obstaclePosition = obstaclePositionsRef.current[index];
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - obstaclePosition.x, 2) +
        Math.pow(playerPosition.z - obstaclePosition.z, 2)
      );

      if (distance < 1) {
        onCollision();
      }
    });
  }, [playerPosition, onCollision]);

  return (
    <group>
      {obstaclePositionsRef.current.map((position, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) obstaclesRef.current[i] = el;
          }}
          position={[position.x, 0.5, position.z]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#650D89" />
        </mesh>
      ))}
    </group>
  );
};

export default ObstaclesGenerator;
