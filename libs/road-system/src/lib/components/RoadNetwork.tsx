import { useEffect, useState } from 'react';
import { RoadNetwork } from '../types/road.types';
import { RoadSegmentMesh } from './RoadSegmentMesh';

type RoadNetworkComponentProps = {
  network: RoadNetwork;
  onLoad?: () => void;
  debug?: boolean;
};

/**
 * Component that renders the entire road network
 */
export const RoadNetworkComponent = ({
  network,
  onLoad,
  debug = false,
}: RoadNetworkComponentProps) => {
  // Track if the overlay should be displayed
  const [showTextureDebug, setShowTextureDebug] = useState(false);

  useEffect(() => {
    // Simulate a loading delay (1ms) to ensure rendering is complete
    const timer = setTimeout(() => {
      onLoad?.();
    }, 1);

    return () => clearTimeout(timer);
  }, [network, onLoad]);

  // Add keyboard listener for texture debug overlay (T key)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' || debug) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 't' || event.key === 'T') {
          // Instead of toggling the overlay component, create a custom event
          // that will be handled outside of the Three.js canvas
          const customEvent = new CustomEvent('cyclepath:toggleTextureDebug', {
            detail: { visible: !showTextureDebug },
          });
          window.dispatchEvent(customEvent);
          setShowTextureDebug(!showTextureDebug);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [debug, showTextureDebug]);

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
