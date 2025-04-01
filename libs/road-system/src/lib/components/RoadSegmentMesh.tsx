import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { RoadSegment } from '../types/road.types';
import { useRoadTextures } from '../utils/use-road-textures';
import { useCSS2DRenderer } from '../utils/useCSS2DRenderer';

interface RoadSegmentMeshProps {
  segment: RoadSegment;
  showDebug?: boolean;
  index?: number;
  debug?: boolean; // Added to match the prop passed from RoadNetworkComponent
}

/**
 * Component that renders a 3D mesh for a road segment
 * Handles texture loading, debug visualization, and segment type-specific rendering
 */
export function RoadSegmentMesh({
  segment,
  showDebug = process.env.NODE_ENV === 'development',
  index,
}: RoadSegmentMeshProps) {
  // Initialize CSS2DRenderer
  useCSS2DRenderer();

  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { width, length, position, rotation } = segment;
  const textures = useRoadTextures(segment);

  // Store the material reference for updates
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Monitor texture loading state
  useEffect(() => {
    const textureArray = [
      textures.map,
      textures.normalMap,
      textures.roughnessMap,
      textures.markingsMap,
    ].filter(Boolean);

    const handleTextureLoad = () => {
      if (materialRef.current) {
        materialRef.current.needsUpdate = true;
      }
    };

    textureArray.forEach((texture) => {
      if (texture) {
        texture.addEventListener('dispose', handleTextureLoad);
      }
    });

    return () => {
      textureArray.forEach((texture) => {
        if (texture) {
          texture.removeEventListener('dispose', handleTextureLoad);
        }
      });
    };
  }, [textures]);

  // Debug visualization setup
  useEffect(() => {
    if (!showDebug || !meshRef.current) return;

    // Store the current mesh reference to avoid closure issues
    const currentMesh = meshRef.current;

    // Create connection point markers with direction indicators
    const markers: THREE.Object3D[] = [];

    Object.entries(segment.connections).forEach(([key, connection]) => {
      // Convert connection position to local space for the markers
      const localPos = new THREE.Vector3();
      localPos.copy(connection.position).sub(segment.position);

      // Create connection point marker
      const markerGeometry = new THREE.SphereGeometry(0.3);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: connection.connectedToId ? 'green' : 'yellow',
        transparent: true,
        opacity: 0.8,
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(localPos);
      marker.position.y = 0.3; // Slightly above road surface
      currentMesh.add(marker);
      markers.push(marker);

      // Create direction arrow
      const direction = new THREE.Vector3(
        connection.direction.x,
        0,
        connection.direction.y
      ).normalize();
      const arrowHelper = new THREE.ArrowHelper(
        direction,
        localPos,
        2,
        connection.connectedToId ? 0x00ff00 : 0xffff00,
        0.5,
        0.3
      );
      currentMesh.add(arrowHelper);
      markers.push(arrowHelper);

      // Add text label for connection point
      const labelDiv = document.createElement('div');
      labelDiv.className = 'label';
      labelDiv.textContent = key;
      labelDiv.style.color = connection.connectedToId ? 'green' : 'yellow';
      labelDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
      labelDiv.style.padding = '2px 4px';
      labelDiv.style.borderRadius = '2px';
      const label = new CSS2DObject(labelDiv);
      label.position.copy(localPos);
      label.position.y += 0.5;
      currentMesh.add(label);
      markers.push(label);
    });

    // Add warning for invalid rotation
    if (
      Math.abs(segment.rotation.x) > 0.001 ||
      Math.abs(segment.rotation.z) > 0.001
    ) {
      const geometryMaterial = new THREE.MeshBasicMaterial({
        color: 'red',
        transparent: true,
        opacity: 0.3,
      });
      const warningGeometry = new THREE.BoxGeometry(1, 0.2, 1);
      const warningMesh = new THREE.Mesh(warningGeometry, geometryMaterial);
      warningMesh.position.set(0, 0.5, 0);
      currentMesh.add(warningMesh);
      markers.push(warningMesh);
    }

    // Cleanup function
    return () => {
      markers.forEach((marker) => {
        currentMesh.remove(marker);
        if (marker instanceof THREE.Mesh) {
          marker.geometry.dispose();
          (marker.material as THREE.Material).dispose();
        }
      });
    };
  }, [segment, showDebug]);

  // Animation for hover effect - only active in debug mode
  useFrame(() => {
    if (isHovered && meshRef.current && showDebug) {
      const time = Date.now() * 0.001;
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material && 'emissive' in material) {
        material.emissive
          .setHex(0x333333)
          .multiplyScalar(0.5 + Math.sin(time * 2) * 0.25);
      }
    } else if (!isHovered && meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material && 'emissive' in material) {
        material.emissive.setHex(showDebug ? 0x222222 : 0x000000);
      }
    }
  });

  return (
    <>
      <group
        position={[position.x, position.y, position.z]}
        rotation={[0, rotation.y, 0]} // Apply ONLY Y-axis rotation to the group
      >
        <mesh
          ref={meshRef}
          rotation={[0, 0, 0]} // No additional rotation on the mesh itself
          onPointerOver={() => showDebug && setIsHovered(true)}
          onPointerOut={() => showDebug && setIsHovered(false)}
          receiveShadow
        >
          {/* Use BoxGeometry instead of PlaneGeometry to avoid needing X rotation */}
          <boxGeometry args={[width, 0.05, length]} />
          <meshStandardMaterial
            ref={materialRef}
            color={textures.map ? 0xffffff : 0x555555}
            map={textures.map || null}
            normalMap={textures.normalMap || null}
            roughnessMap={textures.roughnessMap || null}
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>

        {/* Road markings layer */}
        {textures.markingsMap && (
          <mesh
            position={[0, 0.03, 0]} // Slightly above the road surface
            rotation={[0, 0, 0]} // No additional rotation
            receiveShadow={false}
          >
            <boxGeometry args={[width, 0.01, length]} />
            <meshBasicMaterial
              transparent
              opacity={1.0}
              blending={THREE.NormalBlending}
              depthWrite={false}
              alphaTest={0.01}
              map={textures.markingsMap}
            />
          </mesh>
        )}
      </group>

      {/* Debug visualization elements */}
      {showDebug && index !== undefined && (
        <Text
          position={[position.x, position.y + 2, position.z]}
          fontSize={0.3}
          color="#ff3366"
          anchorX="center"
          anchorY="middle"
        >
          {`#${index} (${segment.id.substring(0, 6)})`}
        </Text>
      )}
    </>
  );
}
