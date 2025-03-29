import { useEffect, useState } from 'react';
import { RoadNetwork } from '../types/road.types';
import { RoadSegmentMesh } from './RoadSegmentMesh';

type RoadNetworkComponentProps = {
  network: RoadNetwork;
  onLoad?: () => void;
  debug?: boolean;
};

export const RoadNetworkComponent = ({
  network,
  onLoad,
  debug = false,
}: RoadNetworkComponentProps) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Debug log the network being rendered
    console.log('Rendering road network:', {
      segmentCount: network.segments.length,
      segments: network.segments.map(segment => ({
        id: segment.id,
        type: segment.type,
        position: `(${segment.position.x.toFixed(2)}, ${segment.position.y.toFixed(2)}, ${segment.position.z.toFixed(2)})`,
      }))
    });

    // Simulate a loading delay (1ms) to ensure rendering is complete
    const timer = setTimeout(() => {
      setLoaded(true);
      onLoad?.();
    }, 1);

    return () => clearTimeout(timer);
  }, [network, onLoad]);

  return (
    <group>
      {network.segments.map((segment) => (
        <RoadSegmentMesh key={segment.id} segment={segment} debug={debug} />
      ))}

      {/* Debug visual markers for network start point and checkpoints */}
      {(process.env.NODE_ENV === 'development' || debug) && (
        <>
          {/* Network start point (magenta) */}
          <mesh position={[network.startPoint.x, 1, network.startPoint.z]}>
            <sphereGeometry args={[0.7, 16, 16]} />
            <meshBasicMaterial color="magenta" />
          </mesh>

          {/* Checkpoints (orange) */}
          {network.checkpoints.map((point, index) => (
            <mesh key={index} position={[point.x, 1, point.z]}>
              <sphereGeometry args={[0.5, 8, 8]} />
              <meshBasicMaterial color="orange" />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
};
