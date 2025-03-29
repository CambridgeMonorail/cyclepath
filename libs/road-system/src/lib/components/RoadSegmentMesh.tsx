import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RoadSegment,
  StraightRoadSegment,
  CurvedRoadSegment,
  IntersectionRoadSegment,
  JunctionRoadSegment
} from '../types/road.types';
import { useRoadTextures } from '../utils/use-road-textures';

type RoadSegmentMeshProps = {
  segment: RoadSegment;
  debug?: boolean;
};

export const RoadSegmentMesh = ({ segment, debug = false }: RoadSegmentMeshProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const startMarkerRef = useRef<THREE.Mesh>(null);
  const endMarkerRef = useRef<THREE.Mesh>(null);
  const arrowHelperRef = useRef<THREE.ArrowHelper>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { width, length, position, rotation } = segment;
  const textures = useRoadTextures(segment);

  // Log when segment is rendered
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Rendering RoadSegment ${segment.id} at position:`,
        position.toArray().map(v => v.toFixed(2)).join(', '),
        'rotation:', rotation.toArray().map(v => (v * 180 / Math.PI).toFixed(2)).join(', '),
        'dimensions:', `${width}x${length}`);

      // Debug texture loading
      console.log(`Textures for segment ${segment.id}:`, {
        baseTexture: textures.map ? 'Loaded' : 'Missing',
        normalMap: textures.normalMap ? 'Loaded' : 'Missing',
        roughnessMap: textures.roughnessMap ? 'Loaded' : 'Missing'
      });
    }
  }, [segment.id, position, rotation, width, length, textures]);

  // Ensure textures are properly configured
  useEffect(() => {
    if (textures.map) {
      textures.map.needsUpdate = true;
      textures.map.colorSpace = THREE.SRGBColorSpace;
    }
    if (textures.normalMap) {
      textures.normalMap.needsUpdate = true;
    }
    if (textures.roughnessMap) {
      textures.roughnessMap.needsUpdate = true;
    }
  }, [textures]);

  // Visualization debugging helpers
  useEffect(() => {
    if (debug && meshRef.current) {
      console.log(`Setting up debug visualizations for segment ${segment.id}`);

      // Handle different segment types with their connection structures
      if (isStraightSegment(segment) || isCurvedSegment(segment)) {
        const startConnection = segment.connections.start;
        const endConnection = segment.connections.end;

        if (startMarkerRef.current) {
          startMarkerRef.current.position.copy(startConnection.position);
          console.log(`Start marker positioned at:`, startConnection.position);
        }

        if (endMarkerRef.current) {
          endMarkerRef.current.position.copy(endConnection.position);
          console.log(`End marker positioned at:`, endConnection.position);
        }
      }

      // Create direction arrow for the segment
      if (meshRef.current) {
        // Remove old arrow if it exists
        if (arrowHelperRef.current) {
          meshRef.current.remove(arrowHelperRef.current);
        }

        // Create new arrow helper showing segment direction
        const center = new THREE.Vector3(0, 0.5, 0);
        const direction = new THREE.Vector3(0, 0, -1).normalize();
        const arrowHelper = new THREE.ArrowHelper(
          direction,
          center,
          length / 2,
          0x00ff00,
          1,
          0.5
        );
        arrowHelperRef.current = arrowHelper;
        meshRef.current.add(arrowHelper);
        console.log(`Direction arrow added to segment ${segment.id}`);
      }
    }
  }, [segment, debug, length]);

  // Animation for hover effect
  useFrame(() => {
    if (isHovered && meshRef.current) {
      // Simple hover animation
      const time = Date.now() * 0.001;
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material && 'emissive' in material) {
        material.emissive = new THREE.Color(0x333333).multiplyScalar(0.5 + Math.sin(time * 2) * 0.25);
      }
    }
  });

  // Helper function to render debug visualization based on segment type
  const renderDebugVisuals = () => {
    if (!debug) return null;

    console.log(`Rendering debug visuals for segment ${segment.id}, type: ${segment.type}`);

    if (isStraightSegment(segment) || isCurvedSegment(segment)) {
      const { start, end } = segment.connections;
      return (
        <>
          {/* Start connection marker */}
          <mesh ref={startMarkerRef} position={start.position} scale={[1, 1, 1]}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color="green" />
          </mesh>

          {/* End connection marker */}
          <mesh ref={endMarkerRef} position={end.position} scale={[1, 1, 1]}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color="red" />
          </mesh>

          {/* Connection line */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([
                  start.position.x, start.position.y, start.position.z,
                  end.position.x, end.position.y, end.position.z,
                ]), 3]}
                count={2}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="yellow" linewidth={2} />
          </line>
        </>
      );
    } else if (isIntersectionSegment(segment)) {
      // Special rendering for intersection segments could be added here
      return null;
    } else if (isJunctionSegment(segment)) {
      // Special rendering for junction segments could be added here
      return null;
    }

    return null;
  };

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      <mesh
        ref={meshRef}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]} // Rotate the plane to lie flat on the XZ plane
      >
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial
          color={textures.map ? undefined : "#555555"}
          map={textures.map}
          normalMap={textures.normalMap}
          roughnessMap={textures.roughnessMap}
          roughness={0.8}
          metalness={0.2}
          side={THREE.DoubleSide}
          // Visualize the segment with bright color in debug mode
          emissive={debug ? new THREE.Color(0x444444) : undefined}
        />
      </mesh>

      {/* Debug visualization elements */}
      {renderDebugVisuals()}
    </group>
  );
};

// Type guard functions to check segment types
const isStraightSegment = (segment: RoadSegment): segment is StraightRoadSegment =>
  segment.type === 'straight';

const isCurvedSegment = (segment: RoadSegment): segment is CurvedRoadSegment =>
  segment.type === 'curve';

const isIntersectionSegment = (segment: RoadSegment): segment is IntersectionRoadSegment =>
  segment.type === 'intersection';

const isJunctionSegment = (segment: RoadSegment): segment is JunctionRoadSegment =>
  segment.type === 'junction';
