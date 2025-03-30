import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RoadNetworkComponent } from '@cyclepath/road-system';
import { RoadNetworkBuilder } from '@cyclepath/road-system';

/**
 * Demonstrates the square road network with two straight segments on each side
 * and curved corners at 90-degree angles
 */
export const SquareTrackDemo = () => {
  const [networkReady, setNetworkReady] = useState(false);

  // Create the square road network
  const roadNetwork = RoadNetworkBuilder.createSquareNetwork(
    80, // sideLength
    15, // cornerRadius
    7 // roadWidth
  );

  useEffect(() => {
    console.log('Square track network created with:', {
      segments: roadNetwork.segments.length,
      startPoint: roadNetwork.startPoint,
      checkpoints: roadNetwork.checkpoints.length,
    });
  }, [roadNetwork]);

  return (
    <div className="w-full h-full">
      <Canvas shadows camera={{ position: [0, 50, 0], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} castShadow />

        {/* Ground plane */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
          position={[0, -0.1, 0]}
        >
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#2a623d" />
        </mesh>

        {/* Road network with debug visualization enabled */}
        <RoadNetworkComponent
          network={roadNetwork}
          debug={true}
          onLoad={() => setNetworkReady(true)}
        />

        {/* Controls for camera */}
        <OrbitControls />
      </Canvas>

      {/* Loading indicator */}
      {!networkReady && (
        <div className="absolute top-5 left-5 bg-black bg-opacity-70 text-white px-4 py-2 rounded">
          Loading road network...
        </div>
      )}

      {/* Info overlay */}
      <div className="absolute bottom-5 left-5 bg-black bg-opacity-70 text-white px-4 py-2 rounded">
        <p>Square Track Demo</p>
        <p className="text-sm">
          {roadNetwork.segments.length} segments,{' '}
          {roadNetwork.checkpoints.length} checkpoints
        </p>
        <p className="text-sm text-gray-300 mt-2">
          Hold right mouse to rotate, scroll to zoom
        </p>
      </div>
    </div>
  );
};
