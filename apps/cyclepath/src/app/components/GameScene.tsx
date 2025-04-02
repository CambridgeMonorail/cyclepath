import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Stats } from '@react-three/drei';
import { Suspense, useState, useEffect, useMemo } from 'react';
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
            const memoryInfo = (
              performance as Performance & {
                memory: {
                  totalJSHeapSize: number;
                  usedJSHeapSize: number;
                  jsHeapSizeLimit: number;
                };
              }
            ).memory;
            console.log('Memory usage:', {
              totalJSHeapSize: `${Math.round(
                memoryInfo.totalJSHeapSize / (1024 * 1024)
              )}MB`,
              usedJSHeapSize: `${Math.round(
                memoryInfo.usedJSHeapSize / (1024 * 1024)
              )}MB`,
              jsHeapSizeLimit: `${Math.round(
                memoryInfo.jsHeapSizeLimit / (1024 * 1024)
              )}MB`,
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

    return undefined; // Explicitly return undefined when no cleanup is needed
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
    Math.PI / 2
  ); // Default to East (π/2)

  // Use the new square track layout instead of the test network
  const roadNetwork = useMemo(
    () => SimpleRoadBuilder.createSquareTrack(7, 8),
    []
  );

  const [sceneReady, setSceneReady] = useState(false);
  const [showPerformanceStats, setShowPerformanceStats] = useState(
    process.env.NODE_ENV === 'development'
  );
  // Always initialize debug mode as false
  const [debugMode, setDebugMode] = useState(false);

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

  // Toggle performance stats with 'P' key in development
  // Toggle debug mode with 'D' key in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'p' || e.key === 'P') {
          setShowPerformanceStats((prev) => !prev);
        }
        // Add debug mode toggle with 'D' key
        if (e.key === 'd' || e.key === 'D') {
          setDebugMode((prev) => !prev);
          console.log('Road debug mode:', !debugMode ? 'enabled' : 'disabled');
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
    return undefined; // Explicitly return undefined for non-development environments
  }, [debugMode]);

  return (
    <div className="w-full h-screen" role="region" aria-label="Game Scene">
      <Canvas
        camera={{
          // Configure the default camera - will be controlled by PlayerCamera during gameplay
          position: [0, 5, 10],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          // Recommended settings for Three.js performance
          powerPreference: 'high-performance',
          antialias: true,
          stencil: false,
          depth: true,
          alpha: false,
          // Helps with context restoration
          preserveDrawingBuffer: true,
        }}
        shadows
      >
        <Suspense fallback={null}>
          <WebGLContextManager />
          {/* Add the SkyBox component to create a background for the scene */}
          <SkyBox size={1024} />
          {/* Add the Floor component to create a green ground plane */}
          <Floor color="#90C95B" size={1024} receiveShadow />
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
              {/* Add the PlayerCamera component to follow the player */}
              <PlayerCamera
                player={{
                  position: playerPosition,
                  rotation: playerRotation,
                }}
                followDistance={7} // Adjust this value to control how far behind the player the camera is
                height={3} // Adjust height for a nice viewing angle
                smoothness={0.05} // Lower for more responsive, higher for smoother camera
              />
            </>
          )}

          {/* Enable OrbitControls only in debug mode */}
          <OrbitControls
            enabled={!isPlaying || debugMode}
            makeDefault
            minDistance={1}
            maxDistance={100}
            target={
              debugMode ? undefined : [playerPosition.x, 0, playerPosition.z]
            }
          />

          {/* Show debug camera info when in debug mode */}
          {debugMode && <CameraDebugHelper />}

          {showPerformanceStats && <Stats />}
        </Suspense>
      </Canvas>

      {/* Add the standalone texture debugger outside of the Canvas */}
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
