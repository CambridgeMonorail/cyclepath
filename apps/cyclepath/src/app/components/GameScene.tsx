import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoadNetworkComponent, RoadNetworkBuilder } from '@cyclepath/road-system';
import { useWebGLContextHandler } from '@cyclepath/road-system';
import ObstaclesGenerator from './ObstaclesGenerator';

// Webgl context handler component that registers the renderer
const WebGLContextManager = () => {
  const { gl } = useThree();
  const { registerRenderer } = useWebGLContextHandler();

  useEffect(() => {
    if (gl) {
      registerRenderer(gl);

      // Enable memory info logging for debugging
      if (process.env.NODE_ENV === 'development') {
        const logMemoryInfo = () => {
          if ('performance' in window && 'memory' in performance) {
            const memoryInfo = (performance as any).memory;
            console.debug('Memory usage:', {
              totalJSHeapSize: `${Math.round(memoryInfo.totalJSHeapSize / (1024 * 1024))}MB`,
              usedJSHeapSize: `${Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024))}MB`,
              jsHeapSizeLimit: `${Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024))}MB`,
            });
          }
        };

        // Log memory info every 30 seconds in development mode
        const intervalId = setInterval(logMemoryInfo, 30000);
        return () => clearInterval(intervalId);
      }
    }
  }, [gl, registerRenderer]);

  return null;
};

type GameSceneProps = {
  isPlaying: boolean;
  onGameOver: () => void;
};

export const GameScene = ({ isPlaying, onGameOver }: GameSceneProps) => {
  const [playerPosition, setPlayerPosition] = useState({ x: 0, z: 0 });
  const roadNetwork = useMemo(() => RoadNetworkBuilder.createTestNetwork(), []);
  const [sceneReady, setSceneReady] = useState(false);

  // Handle scene loaded event
  const handleSceneLoaded = () => {
    setSceneReady(true);
  };

  return (
    <div
      className="w-full h-screen"
      role="region"
      aria-label="Game Scene"
    >
      <Canvas
        camera={{ position: [0, 5, 10], fov: 50 }}
        gl={{
          // Set WebGL parameters for better stability
          powerPreference: 'high-performance',
          antialias: true,
          stencil: false,
          depth: true,
          // Increase texture max size for high-resolution textures
          // But not too high to avoid memory issues
          alpha: false
        }}
        onCreated={({ gl }) => {
          // Enable WebGL error checking in development
          if (process.env.NODE_ENV === 'development') {
            gl.debug.checkShaderErrors = true;
          } else {
            gl.debug.checkShaderErrors = false;
          }
        }}
      >
        <Suspense fallback={null}>
          <WebGLContextManager />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <RoadNetworkComponent network={roadNetwork} onLoad={handleSceneLoaded} />
          {sceneReady && (
            <ObstaclesGenerator
              count={15}
              range={30}
              playerPosition={playerPosition}
              onCollision={onGameOver}
            />
          )}
          {isPlaying && sceneReady && (
            <Player
              position={playerPosition}
              onMove={setPlayerPosition}
              roadNetwork={roadNetwork}
            />
          )}
          <OrbitControls enabled={!isPlaying} />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Player component
const Player = ({
  position,
  onMove,
  roadNetwork
}: {
  position: { x: number; z: number };
  onMove: (pos: { x: number; z: number }) => void;
  roadNetwork: import('@cyclepath/road-system').RoadNetwork;
}) => {
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
      if (e.key === 'ArrowUp' || e.key === 'w') setKeys(keys => ({ ...keys, forward: true }));
      if (e.key === 'ArrowDown' || e.key === 's') setKeys(keys => ({ ...keys, backward: true }));
      if (e.key === 'ArrowLeft' || e.key === 'a') setKeys(keys => ({ ...keys, left: true }));
      if (e.key === 'ArrowRight' || e.key === 'd') setKeys(keys => ({ ...keys, right: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') setKeys(keys => ({ ...keys, forward: false }));
      if (e.key === 'ArrowDown' || e.key === 's') setKeys(keys => ({ ...keys, backward: false }));
      if (e.key === 'ArrowLeft' || e.key === 'a') setKeys(keys => ({ ...keys, left: false }));
      if (e.key === 'ArrowRight' || e.key === 'd') setKeys(keys => ({ ...keys, right: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    const speed = 5;
    const rotationSpeed = 2;

    if (keys.left) {
      setRotation(r => r + rotationSpeed * delta);
    }
    if (keys.right) {
      setRotation(r => r - rotationSpeed * delta);
    }

    const moveX = Math.sin(rotation);
    const moveZ = Math.cos(rotation);

    let newPosition = { ...position };

    if (keys.forward) {
      newPosition = {
        x: position.x - moveX * speed * delta,
        z: position.z - moveZ * speed * delta
      };
    }
    if (keys.backward) {
      newPosition = {
        x: position.x + moveX * speed * delta,
        z: position.z + moveZ * speed * delta
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

export default GameScene;
