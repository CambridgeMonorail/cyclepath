import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Html,
  OrbitControls,
  Stats,
  Preload,
  AdaptiveDpr,
  PerformanceMonitor,
} from '@react-three/drei';
import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  RoadNetworkComponent,
  SimpleRoadBuilder,
  useWebGLContextHandler,
  checkWebGLSupport,
  StandaloneTextureDebugger,
} from '@cyclepath/road-system';

import ObstaclesGenerator from './ObstaclesGenerator';
import SkyBox from './SkyBox';
import Floor from './Floor';
import Player, { PlayerCamera } from './Player';

// Simplified WebGL context manager
const WebGLContextManager = () => {
  const { gl } = useThree();
  const { registerRenderer } = useWebGLContextHandler();

  useEffect(() => {
    if (gl) {
      // Register the renderer for context handling
      const cleanup = registerRenderer(gl);

      // Apply optimal renderer settings
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1;

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
  const [playerRotation, setPlayerRotation] = useState(0);
  const [initialPlayerRotation, setInitialPlayerRotation] = useState(
    Math.PI + Math.PI / 2
  ); // Changed from Math.PI / 2 (east) to Math.PI + Math.PI / 2 (west) - 270 degrees

  // Use the square track layout
  const roadNetwork = useMemo(
    () => SimpleRoadBuilder.createSquareTrack(7, 8),
    []
  );

  const [sceneReady, setSceneReady] = useState(false);
  const [showPerformanceStats, setShowPerformanceStats] = useState(
    process.env.NODE_ENV === 'development'
  );
  const [debugMode, setDebugMode] = useState(false);

  // Simple performance state
  const [dpr, setDpr] = useState(1.5); // Default DPR value
  const [performanceMode, setPerformanceMode] = useState<
    'low' | 'medium' | 'high'
  >('high');

  // Handle scene loaded event
  const handleSceneLoaded = () => {
    setSceneReady(true);
  };

  // Use the start point from the road network for the initial player position
  useEffect(() => {
    if (roadNetwork && roadNetwork.startPoint) {
      setPlayerPosition({
        x: roadNetwork.startPoint.x,
        z: roadNetwork.startPoint.z,
      });
    }
  }, [roadNetwork]);

  // Toggle performance stats with 'P' key & debug mode with 'D' key in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'p' || e.key === 'P') {
          setShowPerformanceStats((prev) => !prev);
        }
        if (e.key === 'd' || e.key === 'D') {
          setDebugMode((prev) => !prev);
          console.log('Road debug mode:', !debugMode ? 'enabled' : 'disabled');
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
    return undefined;
  }, [debugMode]);

  // Handle performance change
  const handlePerformanceChange = (factor: number) => {
    if (factor < 0.7) {
      setPerformanceMode('low');
      setDpr(1.0); // Lower resolution for low performance
    } else if (factor < 1) {
      setPerformanceMode('medium');
      setDpr(1.25); // Medium resolution
    } else {
      setPerformanceMode('high');
      setDpr(1.5); // Full resolution
    }
  };

  return (
    <div className="w-full h-screen" role="region" aria-label="Game Scene">
      <Canvas
        camera={{
          position: [0, 5, 10],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        dpr={dpr}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          stencil: false,
          depth: true,
          alpha: false,
          preserveDrawingBuffer: true,
        }}
        shadows={performanceMode !== 'low'}
        frameloop="always"
      >
        <PerformanceMonitor
          onIncline={() => handlePerformanceChange(1)}
          onDecline={() => handlePerformanceChange(0.6)}
        />
        <AdaptiveDpr pixelated />

        <Suspense fallback={null}>
          <WebGLContextManager />

          {/* SkyBox and Floor */}
          <SkyBox size={1024} />
          <Floor
            color="#90C95B"
            size={1024}
            receiveShadow={performanceMode !== 'low'}
          />

          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow={performanceMode !== 'low'}
            shadow-mapSize={[
              performanceMode === 'high' ? 1024 : 512,
              performanceMode === 'high' ? 1024 : 512,
            ]}
          />

          {/* Road network */}
          <RoadNetworkComponent
            network={roadNetwork}
            onLoad={handleSceneLoaded}
            debug={debugMode}
          />

          {/* Obstacles */}
          {sceneReady && (
            <ObstaclesGenerator
              count={performanceMode === 'low' ? 8 : 15}
              range={30}
              playerPosition={playerPosition}
              onCollision={onGameOver}
            />
          )}

          {/* Player and Camera */}
          {isPlaying && sceneReady && !debugMode && (
            <>
              <Player
                position={playerPosition}
                onMove={(newPos) => {
                  setPlayerPosition(newPos);
                }}
                roadNetwork={roadNetwork}
                onRotationChange={setPlayerRotation}
                initialRotation={initialPlayerRotation}
              />
              <PlayerCamera
                player={{
                  position: playerPosition,
                  rotation: playerRotation || initialPlayerRotation,
                }}
                followDistance={12}
                height={6}
                smoothness={performanceMode === 'low' ? 0.02 : 0.05}
              />
            </>
          )}

          {/* OrbitControls for debug mode */}
          <OrbitControls
            enabled={!isPlaying || debugMode}
            makeDefault
            minDistance={1}
            maxDistance={100}
            target={
              debugMode ? undefined : [playerPosition.x, 0, playerPosition.z]
            }
          />

          {/* Debug camera info */}
          {debugMode && <CameraDebugHelper />}

          {/* Performance stats */}
          {showPerformanceStats && <Stats />}

          {/* Preload assets */}
          <Preload all />
        </Suspense>
      </Canvas>

      {/* Texture debugger */}
      <StandaloneTextureDebugger />
    </div>
  );
};

export default GameScene;

/**
 * Helper component that displays camera position and controls info in debug mode
 */
const CameraDebugHelper = () => {
  const { camera } = useThree();
  const [cameraInfo, setCameraInfo] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 },
  });

  // Update camera info on each frame
  useFrame(() => {
    // Extract camera position and rotation
    const position = camera.position.clone();
    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion);

    // Get orbit controls target if available
    const controls = camera.userData.controls as { target?: THREE.Vector3 };
    const target = controls?.target || new THREE.Vector3(0, 0, 0);

    // Update state with new values
    setCameraInfo({
      position: {
        x: parseFloat(position.x.toFixed(2)),
        y: parseFloat(position.y.toFixed(2)),
        z: parseFloat(position.z.toFixed(2)),
      },
      rotation: {
        x: parseFloat(THREE.MathUtils.radToDeg(euler.x).toFixed(2)),
        y: parseFloat(THREE.MathUtils.radToDeg(euler.y).toFixed(2)),
        z: parseFloat(THREE.MathUtils.radToDeg(euler.z).toFixed(2)),
      },
      target: {
        x: parseFloat(target.x.toFixed(2)),
        y: parseFloat(target.y.toFixed(2)),
        z: parseFloat(target.z.toFixed(2)),
      },
    });
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Display camera information as 3D text */}
      <mesh position={[0, 2, -5]} rotation={[0, 0, 0]}>
        <planeGeometry args={[6, 2.5]} />
        <meshBasicMaterial transparent opacity={0.7} color="#000000" />
      </mesh>

      {/* Simple text overlay to show camera info */}
      <Html position={[0, 2, -4.95]} transform>
        <div
          style={{
            color: '#ffffff',
            fontFamily: 'monospace',
            fontSize: '12px',
            width: '300px',
            padding: '10px',
            textAlign: 'left',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            CAMERA DEBUG
          </div>
          <div>
            Position: X: {cameraInfo.position.x} Y: {cameraInfo.position.y} Z:{' '}
            {cameraInfo.position.z}
          </div>
          <div>
            Rotation: X: {cameraInfo.rotation.x}° Y: {cameraInfo.rotation.y}° Z:{' '}
            {cameraInfo.rotation.z}°
          </div>
          <div>
            Target: X: {cameraInfo.target.x} Y: {cameraInfo.target.y} Z:{' '}
            {cameraInfo.target.z}
          </div>
          <div style={{ marginTop: '5px', fontSize: '10px' }}>
            <span style={{ color: '#ffcc00' }}>Debug Controls:</span> Mouse drag
            to rotate, scroll to zoom, right-click to pan
          </div>
        </div>
      </Html>
    </group>
  );
};
