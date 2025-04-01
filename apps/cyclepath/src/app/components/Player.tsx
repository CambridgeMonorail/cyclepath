import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoadNetwork } from '@cyclepath/road-system';

type PlayerProps = {
  position: { x: number; z: number };
  onMove: (pos: { x: number; z: number }) => void;
  roadNetwork: RoadNetwork;
  onRotationChange?: (rotation: number) => void; // Add new prop to report rotation changes
};

// New component for camera that follows the player
export const PlayerCamera = ({
  player,
  followDistance = 5,
  height = 2.5,
  smoothness = 0.1,
}: {
  player: { position: { x: number; z: number }; rotation: number };
  followDistance?: number;
  height?: number;
  smoothness?: number;
}) => {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3());

  useFrame(() => {
    // Calculate the ideal camera position behind the player
    const moveX = Math.sin(player.rotation);
    const moveZ = Math.cos(player.rotation);

    // Position camera behind player based on player's rotation
    targetPosition.current.set(
      player.position.x + moveX * followDistance,
      height,
      player.position.z + moveZ * followDistance
    );

    // Smoothly interpolate camera position
    camera.position.lerp(targetPosition.current, smoothness);

    // Make camera look at player position
    camera.lookAt(player.position.x, 0.5, player.position.z);
  });

  return null;
};

export const Player = ({
  position,
  onMove,
  roadNetwork,
  onRotationChange,
}: PlayerProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [rotation, setRotation] = useState(0);
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w')
        setKeys((keys) => ({ ...keys, forward: true }));
      if (e.key === 'ArrowDown' || e.key === 's')
        setKeys((keys) => ({ ...keys, backward: true }));
      if (e.key === 'ArrowLeft' || e.key === 'a')
        setKeys((keys) => ({ ...keys, left: true }));
      if (e.key === 'ArrowRight' || e.key === 'd')
        setKeys((keys) => ({ ...keys, right: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w')
        setKeys((keys) => ({ ...keys, forward: false }));
      if (e.key === 'ArrowDown' || e.key === 's')
        setKeys((keys) => ({ ...keys, backward: false }));
      if (e.key === 'ArrowLeft' || e.key === 'a')
        setKeys((keys) => ({ ...keys, left: false }));
      if (e.key === 'ArrowRight' || e.key === 'd')
        setKeys((keys) => ({ ...keys, right: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Report rotation changes to parent component
  useEffect(() => {
    if (onRotationChange) {
      onRotationChange(rotation);
    }
  }, [rotation, onRotationChange]);

  useFrame((state, delta) => {
    const speed = 5;
    const rotationSpeed = 2;

    if (keys.left) {
      setRotation((r) => r + rotationSpeed * delta);
    }
    if (keys.right) {
      setRotation((r) => r - rotationSpeed * delta);
    }

    const moveX = Math.sin(rotation);
    const moveZ = Math.cos(rotation);

    let newPosition = { ...position };

    if (keys.forward) {
      newPosition = {
        x: position.x - moveX * speed * delta,
        z: position.z - moveZ * speed * delta,
      };
    }
    if (keys.backward) {
      newPosition = {
        x: position.x + moveX * speed * delta,
        z: position.z + moveZ * speed * delta,
      };
    }

    if (newPosition.x !== position.x || newPosition.z !== position.z) {
      // TODO: Add road boundary checking here
      onMove(newPosition);
    }

    if (meshRef.current) {
      meshRef.current.position.x = position.x;
      meshRef.current.position.z = position.z;
      meshRef.current.rotation.y = rotation;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[position.x, 0.5, position.z]}
      rotation={[0, rotation, 0]}
    >
      <boxGeometry args={[1, 1, 2]} />
      <meshStandardMaterial color="#FF6C11" /> {/* neon-orange from palette */}
    </mesh>
  );
};

export default Player;
