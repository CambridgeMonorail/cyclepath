import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoadNetworkComponent, RoadNetworkBuilder } from '@cyclepath/road-system';
import { useWebGLContextHandler, checkWebGLSupport } from '@cyclepath/road-system';

import ObstaclesGenerator from './ObstaclesGenerator';

// Simplified WebGL context manager that leverages Three.js's built-in capabilities
const WebGLContextManager = () => {
  const { gl } = useThree();
  const { registerRenderer } = useWebGLContextHandler();

  useEffect(() => {
    if (gl) {
      // Register the renderer for context handling
      const cleanup = registerRenderer(gl);

      // Check WebGL support
      const webGLSupport = checkWebGLSupport();
      if (!webGLSupport.isSupported) {
        console.warn('WebGL support issue:', webGLSupport.message);
      }

      // Monitor memory in development mode
      if (process.env.NODE_ENV === 'development') {
        const logMemoryInfo = () => {
          if ('performance' in window && 'memory' in performance) {
            const memoryInfo = (performance as any).memory;
            console.log('Memory usage:', {
              totalJSHeapSize: `${Math.round(memoryInfo.totalJSHeapSize / (1024 * 1024))}MB`,
              usedJSHeapSize: `${Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024))}MB`,
              jsHeapSizeLimit: `${Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024))}MB`,
            });
          }
        };

        const intervalId = setInterval(logMemoryInfo, 30000);
        return () => {
          clearInterval(intervalId);
          cleanup?.();
        };
      }

      return cleanup;
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
  const [showPerformanceStats, setShowPerformanceStats] = useState(
    process.env.NODE_ENV === 'development'
  );
  // Add debug mode state - enabled by default in development mode
  const [debugMode, setDebugMode] = useState(process.env.NODE_ENV === 'development');

  // Handle scene loaded event
  const handleSceneLoaded = () => {
    setSceneReady(true);
  };

  // Toggle performance stats with 'P' key in development
  // Toggle debug mode with 'D' key in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'p' || e.key === 'P') {
          setShowPerformanceStats(prev => !prev);
        }
        // Add debug mode toggle with 'D' key
        if (e.key === 'd' || e.key === 'D') {
          setDebugMode(prev => !prev);
          console.log('Road debug mode:', !debugMode ? 'enabled' : 'disabled');
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [debugMode]);

  return (
    <div
      className="w-full h-screen"
      role="region"
      aria-label="Game Scene"
    >
      <Canvas
        camera={{ position: [0, 5, 10], fov: 50 }}
        gl={{
          // Recommended settings for Three.js performance
          powerPreference: 'high-performance',
          antialias: true,
          stencil: false,
          depth: true,
          alpha: false,
          // Helps with context restoration
          preserveDrawingBuffer: true
        }}
        shadows
      >
        <Suspense fallback={null}>
          <WebGLContextManager />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />

          <RoadNetworkComponent
            network={roadNetwork}
            onLoad={handleSceneLoaded}
            debug={debugMode}
          />

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

          {showPerformanceStats && <Stats />}
        </Suspense>
      </Canvas>
    </div>
  );
};

// Player component
const Player = ({
  position,
  onMove,
  roadNetwork,
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

export default GameScene;
