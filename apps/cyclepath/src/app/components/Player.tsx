import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoadNetwork } from '@cyclepath/road-system';

type PlayerProps = {
  position: { x: number; z: number };
  onMove: (pos: { x: number; z: number }) => void;
  roadNetwork: RoadNetwork;
  onRotationChange?: (rotation: number) => void;
  initialRotation?: number;
};

// Optimized camera that follows the player with reduced juddering
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
  const lastPosition = useRef(new THREE.Vector3());
  const isFirstUpdate = useRef(true);

  // Pre-calculate values that don't need to change every frame
  const playerTarget = useMemo(() => new THREE.Vector3(), []);

  // Position camera directly behind player on mount
  useEffect(() => {
    if (camera) {
      // Calculate position behind player based on player's rotation
      const moveX = Math.sin(player.rotation);
      const moveZ = Math.cos(player.rotation);

      // Set camera position directly behind player
      camera.position.set(
        player.position.x + moveX * followDistance,
        height,
        player.position.z + moveZ * followDistance
      );

      // Look at player
      playerTarget.set(player.position.x, 0.5, player.position.z);
      camera.lookAt(playerTarget);

      // Record last position
      lastPosition.current.copy(camera.position);

      console.log('Camera initialized behind player', {
        playerPos: player.position,
        playerRot: player.rotation,
        cameraPos: camera.position,
      });
    }
  }, [
    camera,
    player.position.x,
    player.position.z,
    player.rotation,
    followDistance,
    height,
    playerTarget,
  ]);

  useFrame((_, delta) => {
    // Calculate desired position behind player
    const moveX = Math.sin(player.rotation);
    const moveZ = Math.cos(player.rotation);

    const targetX = player.position.x + moveX * followDistance;
    const targetZ = player.position.z + moveZ * followDistance;

    // For first frame, set position immediately
    if (isFirstUpdate.current) {
      camera.position.x = targetX;
      camera.position.y = height;
      camera.position.z = targetZ;
      lastPosition.current.copy(camera.position);
      isFirstUpdate.current = false;
      return;
    }

    // Simple smooth follow with fixed time step for stability
    const fixedDelta = Math.min(delta, 0.05); // Cap delta for stability
    const lerpFactor = smoothness * fixedDelta * 60; // Normalize for 60fps

    // Update camera position with smoothing
    camera.position.x += (targetX - camera.position.x) * lerpFactor;
    camera.position.y += (height - camera.position.y) * lerpFactor;
    camera.position.z += (targetZ - camera.position.z) * lerpFactor;

    // Look at player
    playerTarget.set(player.position.x, 0.5, player.position.z);
    camera.lookAt(playerTarget);

    // Update last position
    lastPosition.current.copy(camera.position);
  });

  return null;
};

export const Player = ({
  position,
  onMove,
  roadNetwork,
  onRotationChange,
  initialRotation,
}: PlayerProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [rotation, setRotation] = useState(initialRotation || 0);
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

  // Use a ref for movement calculation to avoid unnecessary state updates
  const movementRef = useRef({
    speed: 5,
    rotationSpeed: 2,
  });

  useFrame((_, delta) => {
    const { speed, rotationSpeed } = movementRef.current;

    // Apply rotation with fixed time step for stability
    const fixedDelta = Math.min(delta, 0.03);

    if (keys.left) {
      setRotation((r) => r + rotationSpeed * fixedDelta);
    }
    if (keys.right) {
      setRotation((r) => r - rotationSpeed * fixedDelta);
    }

    const moveX = Math.sin(rotation);
    const moveZ = Math.cos(rotation);

    let newPosition = { ...position };

    if (keys.forward) {
      newPosition = {
        x: position.x - moveX * speed * fixedDelta,
        z: position.z - moveZ * speed * fixedDelta,
      };
    }
    if (keys.backward) {
      newPosition = {
        x: position.x + moveX * speed * fixedDelta,
        z: position.z + moveZ * speed * fixedDelta,
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
      <meshStandardMaterial color="#FF6C11" />
    </mesh>
  );
};

export default Player;
