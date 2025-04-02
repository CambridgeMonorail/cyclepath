import {
  useRef,
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
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

// Define the ref interface for PlayerCamera
export interface PlayerCameraRef {
  resetCamera: () => void;
}

// Optimized camera that follows the player with reduced juddering
export const PlayerCamera = forwardRef<
  PlayerCameraRef,
  {
    player: { position: { x: number; z: number }; rotation: number };
    followDistance?: number;
    height?: number;
    smoothness?: number;
  }
>(({ player, followDistance = 5, height = 2.5, smoothness = 0.1 }, ref) => {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3());
  const currentVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const lastUpdateTime = useRef(performance.now());
  const frameSkip = useRef(0);
  const isFirstFrame = useRef(true);
  const hasForcedInitialPosition = useRef(false);

  // Pre-calculate values that don't need to change every frame
  const playerTarget = useMemo(() => new THREE.Vector3(), []);

  // Expose methods through the ref
  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      // Immediately position camera behind player
      const moveX = Math.sin(player.rotation);
      const moveZ = Math.cos(player.rotation);

      camera.position.set(
        player.position.x + moveX * followDistance,
        height,
        player.position.z + moveZ * followDistance
      );

      // Point camera at player
      playerTarget.set(player.position.x, 0.5, player.position.z);
      camera.lookAt(playerTarget);

      // Reset velocity and flags
      currentVelocity.current.set(0, 0, 0);
      isFirstFrame.current = false;
      hasForcedInitialPosition.current = true;

      console.log('Camera reset behind player:', {
        playerPos: player.position,
        playerRot: player.rotation,
        cameraPos: camera.position,
      });
    },
  }));

  // Ensure camera position is set immediately after component mounts
  useEffect(() => {
    // Force initial positioning with a small delay to ensure everything is ready
    if (!hasForcedInitialPosition.current) {
      const timerId = setTimeout(() => {
        const moveX = Math.sin(player.rotation);
        const moveZ = Math.cos(player.rotation);

        camera.position.set(
          player.position.x + moveX * followDistance,
          height,
          player.position.z + moveZ * followDistance
        );

        playerTarget.set(player.position.x, 0.5, player.position.z);
        camera.lookAt(playerTarget);

        // Reset velocity
        currentVelocity.current.set(0, 0, 0);
        isFirstFrame.current = false;
        hasForcedInitialPosition.current = true;

        console.log('Initial camera position set automatically');
      }, 100);

      return () => clearTimeout(timerId);
    }
  }, []);

  useFrame((_, delta) => {
    // Skip frames if running too fast (helps lower-end devices)
    if (frameSkip.current > 0) {
      frameSkip.current--;
      return;
    }

    // Calculate the ideal camera position behind the player
    const moveX = Math.sin(player.rotation);
    const moveZ = Math.cos(player.rotation);

    // Position camera behind player based on player's rotation
    targetPosition.current.set(
      player.position.x + moveX * followDistance,
      height,
      player.position.z + moveZ * followDistance
    );

    // On first frame, immediately position camera without smoothing
    if (isFirstFrame.current) {
      camera.position.copy(targetPosition.current);
      playerTarget.set(player.position.x, 0.5, player.position.z);
      camera.lookAt(playerTarget);
      isFirstFrame.current = false;
      return;
    }

    // Update last update time for the next frame
    const now = performance.now();
    const frameTime = Math.min((now - lastUpdateTime.current) / 1000, 0.1); // Cap at 100ms to avoid jumps after pauses
    lastUpdateTime.current = now;

    // Use fixed delta time for more stable physics
    const fixedDelta = Math.min(delta, 0.03);

    // Adaptive spring-damper system based on performance (delta time)
    const adaptiveDamping = 4.0 * (1.0 / (delta + 0.01));
    const adaptiveSpring = 10.0 * (1.0 / (delta + 0.01));

    // Apply clamping to avoid excessive forces
    const clampedDamping = Math.min(Math.max(adaptiveDamping, 2.0), 8.0);
    const clampedSpring = Math.min(Math.max(adaptiveSpring, 5.0), 15.0);

    // Direction from current to target with distance calculation
    const direction = new THREE.Vector3().subVectors(
      targetPosition.current,
      camera.position
    );

    // Distance-based adaptive smoothing (smoother when far, more responsive when close)
    const distance = direction.length();
    const distanceFactor = Math.min(distance / 10.0, 1.0);

    // Apply spring force with distance factor
    const springForce = direction
      .clone()
      .multiplyScalar(
        clampedSpring * fixedDelta * (1.0 - distanceFactor * 0.5)
      );

    // Apply damping force with distance factor
    const dampingForce = currentVelocity.current
      .clone()
      .multiplyScalar(-clampedDamping * fixedDelta);

    // Compute new velocity with clamping for stability
    currentVelocity.current.add(springForce).add(dampingForce);

    // Limit maximum velocity to prevent overshooting
    const maxVelocity = 50.0 * fixedDelta;
    if (currentVelocity.current.lengthSq() > maxVelocity * maxVelocity) {
      currentVelocity.current.normalize().multiplyScalar(maxVelocity);
    }

    // Apply velocity to position
    camera.position.add(
      currentVelocity.current.clone().multiplyScalar(fixedDelta)
    );

    // Update look target with more stable approach
    playerTarget.set(player.position.x, 0.5, player.position.z);
    camera.lookAt(playerTarget);

    // Adaptive frame skipping based on performance
    if (delta > 0.025) {
      // Below 40 FPS
      frameSkip.current = Math.min(Math.floor(delta / 0.016) - 1, 2);
    } else {
      frameSkip.current = 0; // Don't skip frames if performance is good
    }
  });

  // Reset camera position when player position or rotation changes significantly
  useEffect(() => {
    // Only run if camera is available and component is mounted
    if (camera && hasForcedInitialPosition.current) {
      const moveX = Math.sin(player.rotation);
      const moveZ = Math.cos(player.rotation);

      // Check if player has moved or rotated significantly to warrant a camera reset
      const idealPosition = new THREE.Vector3(
        player.position.x + moveX * followDistance,
        height,
        player.position.z + moveZ * followDistance
      );

      // Get current distance between camera and ideal position
      const distanceToIdeal = camera.position.distanceTo(idealPosition);

      // If camera is very far from where it should be, do an immediate reset
      if (distanceToIdeal > followDistance * 2) {
        camera.position.copy(idealPosition);
        playerTarget.set(player.position.x, 0.5, player.position.z);
        camera.lookAt(playerTarget);
        currentVelocity.current.set(0, 0, 0);
        console.log('Camera position corrected - was too far from player');
      }
    }
  }, [
    camera,
    player.position.x,
    player.position.z,
    player.rotation,
    followDistance,
    height,
  ]);

  return null;
});

// Ensure proper display name for React DevTools
PlayerCamera.displayName = 'PlayerCamera';

export const Player = ({
  position,
  onMove,
  roadNetwork,
  onRotationChange,
  initialRotation,
}: PlayerProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [rotation, setRotation] = useState(initialRotation || 0);
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  // Movement parameters with performance optimization in mind
  const movementRef = useRef({
    speed: 5,
    rotationSpeed: 2,
    lastUpdateTime: performance.now(),
    accumulatedDelta: 0,
    fixedTimeStep: 1 / 60, // 60 updates per second for physics
    newPosition: { x: position.x, z: position.z },
    lastPosition: { x: position.x, z: position.z },
    lastReportedPosition: { x: position.x, z: position.z },
  });

  // Handle keyboard input with optimized state management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') keysRef.current.forward = true;
      if (e.key === 'ArrowDown' || e.key === 's')
        keysRef.current.backward = true;
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') keysRef.current.forward = false;
      if (e.key === 'ArrowDown' || e.key === 's')
        keysRef.current.backward = false;
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd')
        keysRef.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Use ref for current rotation to avoid setState in animation loop
  const rotationRef = useRef(initialRotation || 0);

  // Report rotation changes to parent component when it actually changes
  useEffect(() => {
    if (onRotationChange && Math.abs(rotationRef.current - rotation) > 0.01) {
      onRotationChange(rotation);
      rotationRef.current = rotation;
    }
  }, [rotation, onRotationChange]);

  useFrame((_, delta) => {
    const movement = movementRef.current;
    const keys = keysRef.current;

    // Use fixed timestep for physics updates
    const now = performance.now();
    const frameTime = Math.min((now - movement.lastUpdateTime) / 1000, 0.1); // Cap at 100ms to avoid spiral of death
    movement.lastUpdateTime = now;

    movement.accumulatedDelta += frameTime;

    // Process physics in fixed time steps for stability
    while (movement.accumulatedDelta >= movement.fixedTimeStep) {
      // Apply rotation with movement smoothing
      let newRotation = rotation;
      if (keys.left) {
        newRotation += movement.rotationSpeed * movement.fixedTimeStep;
      }
      if (keys.right) {
        newRotation -= movement.rotationSpeed * movement.fixedTimeStep;
      }

      // Only update rotation state when it changes significantly
      if (Math.abs(newRotation - rotation) > 0.01) {
        setRotation(newRotation);
      }

      const moveX = Math.sin(rotation);
      const moveZ = Math.cos(rotation);

      // Store last valid position for interpolation
      movement.lastPosition = { ...movement.newPosition };

      // Move based on input
      if (keys.forward) {
        movement.newPosition = {
          x:
            movement.newPosition.x -
            moveX * movement.speed * movement.fixedTimeStep,
          z:
            movement.newPosition.z -
            moveZ * movement.speed * movement.fixedTimeStep,
        };
      }
      if (keys.backward) {
        movement.newPosition = {
          x:
            movement.newPosition.x +
            moveX * movement.speed * movement.fixedTimeStep,
          z:
            movement.newPosition.z +
            moveZ * movement.speed * movement.fixedTimeStep,
        };
      }

      movement.accumulatedDelta -= movement.fixedTimeStep;
    }

    // Interpolation factor for smooth rendering between physics steps
    const alpha = movement.accumulatedDelta / movement.fixedTimeStep;

    // Interpolated position for smooth rendering
    const interpolatedX =
      movement.lastPosition.x +
      (movement.newPosition.x - movement.lastPosition.x) * alpha;
    const interpolatedZ =
      movement.lastPosition.z +
      (movement.newPosition.z - movement.lastPosition.z) * alpha;

    // Update mesh position for visual representation (smooth)
    if (meshRef.current) {
      meshRef.current.position.x = interpolatedX;
      meshRef.current.position.z = interpolatedZ;
      meshRef.current.position.y = 0.5; // Keep fixed height
      meshRef.current.rotation.y = rotation;
    }

    // Only report position to parent when it changes significantly (reduces state updates)
    const dx = interpolatedX - movement.lastReportedPosition.x;
    const dz = interpolatedZ - movement.lastReportedPosition.z;
    const distanceSquared = dx * dx + dz * dz;

    // If moved significantly (> 0.05 units), report the new position
    if (distanceSquared > 0.0025) {
      const newPosition = { x: interpolatedX, z: interpolatedZ };
      onMove(newPosition);
      movement.lastReportedPosition = { ...newPosition };
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
