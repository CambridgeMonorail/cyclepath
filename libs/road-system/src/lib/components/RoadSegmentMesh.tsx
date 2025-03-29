import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RoadSegment,
  StraightRoadSegment,
  CurvedRoadSegment,
} from '../types/road.types';
import { useRoadTextures } from '../utils/use-road-textures';
import { TextureDebugger } from './TextureDebugger';

type RoadSegmentMeshProps = {
  segment: RoadSegment;
  debug?: boolean;
};

/**
 * Component that renders a 3D mesh for a road segment
 * Handles texture loading, debug visualization, and segment type-specific rendering
 */
export const RoadSegmentMesh = ({
  segment,
  debug = false,
}: RoadSegmentMeshProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const markingsRef = useRef<THREE.Mesh>(null);
  const startMarkerRef = useRef<THREE.Mesh>(null);
  const endMarkerRef = useRef<THREE.Mesh>(null);
  const arrowHelperRef = useRef<THREE.ArrowHelper>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { width, length, position, rotation } = segment;
  const textures = useRoadTextures(segment);
  const [materialReady, setMaterialReady] = useState(false);
  const [texturesLoaded, setTexturesLoaded] = useState(false);

  // Store the material reference for updates
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const markingsMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);

  // Verify texture loading status and log debug info
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `Rendering RoadSegment ${segment.id} at position:`,
        position
          .toArray()
          .map((v) => v.toFixed(2))
          .join(', '),
        'rotation (radians):',
        rotation
          .toArray()
          .map((v) => v.toFixed(4))
          .join(', '),
        'rotation (degrees):',
        rotation
          .toArray()
          .map((v) => ((v * 180) / Math.PI).toFixed(2))
          .join(', '),
        'dimensions:',
        `${width}x${length}`
      );

      // Enhanced texture debug logging
      console.log(`Textures for segment ${segment.id}:`, {
        baseTexture: textures.map
          ? `Loaded (${textures.map.source?.uuid})`
          : 'Missing',
        normalMap: textures.normalMap
          ? `Loaded (${textures.normalMap.source?.uuid})`
          : 'Missing',
        roughnessMap: textures.roughnessMap
          ? `Loaded (${textures.roughnessMap.source?.uuid})`
          : 'Missing',
        baseTexturePath:
          textures.map instanceof THREE.Texture &&
          textures.map.source?.data?.src
            ? textures.map.source.data.src
            : 'No path',
        baseTextureSize: textures.map?.image
          ? `${textures.map.image.width}x${textures.map.image.height}`
          : 'Unknown',
      });
    }
  }, [segment.id, position, rotation, width, length, textures]);

  // Check if texture image data is actually loaded
  useEffect(() => {
    const checkTextureLoaded = () => {
      if (!textures.map) return false;

      // For file textures, check if image is loaded
      if (textures.map instanceof THREE.Texture) {
        // Check if image exists and has dimensions
        return !!(
          textures.map.image &&
          textures.map.image.width > 0 &&
          textures.map.image.height > 0
        );
      }

      // For canvas textures, they're always "loaded"
      return true;
    };

    // Check if textures are actually loaded
    const isLoaded = checkTextureLoaded();

    if (isLoaded && !texturesLoaded) {
      console.log(
        `✅ Texture for segment ${segment.id} FULLY loaded with image data`
      );
      setTexturesLoaded(true);

      // Force material update when textures are confirmed to be loaded
      if (materialRef.current) {
        updateMaterial(materialRef.current);
      }

      return undefined;
    } else if (!isLoaded) {
      console.log(
        `⏳ Waiting for texture to fully load for segment ${segment.id}`
      );

      // Set a timer to check again if textures haven't loaded
      const timer = setTimeout(() => {
        const isLoadedRetry = checkTextureLoaded();
        if (isLoadedRetry) {
          console.log(
            `✅ Texture for segment ${segment.id} loaded after retry`
          );
          setTexturesLoaded(true);

          // Force material update after retry
          if (materialRef.current) {
            updateMaterial(materialRef.current);
          }
        } else {
          console.warn(
            `⚠️ Texture for segment ${segment.id} still not fully loaded after timeout`
          );
        }
      }, 1000);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [textures.map, segment.id, texturesLoaded]);

  // Function to update material with textures
  const updateMaterial = (material: THREE.MeshStandardMaterial) => {
    // CRITICAL: Ensure we directly apply textures to the material instance
    if (textures.map) {
      material.map = textures.map;
      material.map.colorSpace = THREE.SRGBColorSpace;
      material.map.wrapS = THREE.RepeatWrapping;
      material.map.wrapT = THREE.RepeatWrapping;

      // Calculate repeat based on road dimensions for consistent texture scaling
      const repeatX = 1;
      const repeatY = length / width; // Adjust repeat based on road dimensions
      material.map.repeat.set(repeatX, repeatY);

      // Make sure we clear any base color that might override the texture
      material.color.set(0xffffff);

      console.log(
        `Base texture for segment ${segment.id} configured with repeat:`,
        `${repeatX}x${repeatY}`
      );
    }

    // Apply normal map if available
    if (textures.normalMap) {
      material.normalMap = textures.normalMap;
      material.normalMap.wrapS = THREE.RepeatWrapping;
      material.normalMap.wrapT = THREE.RepeatWrapping;
      material.normalScale.set(1, 1); // Ensure normal scale is set
      if (textures.map?.repeat) {
        material.normalMap.repeat.copy(textures.map.repeat);
      }
    }

    // Apply roughness map if available
    if (textures.roughnessMap) {
      material.roughnessMap = textures.roughnessMap;
      material.roughnessMap.wrapS = THREE.RepeatWrapping;
      material.roughnessMap.wrapT = THREE.RepeatWrapping;
      if (textures.map?.repeat) {
        material.roughnessMap.repeat.copy(textures.map.repeat);
      }
    }

    // Set PBR material properties for realistic appearance
    material.roughness = 0.8;
    material.metalness = 0.2;
    material.side = THREE.DoubleSide;

    // Setting these flags is crucial for the textures to appear
    material.needsUpdate = true;

    if (textures.map) textures.map.needsUpdate = true;
    if (textures.normalMap) textures.normalMap.needsUpdate = true;
    if (textures.roughnessMap) textures.roughnessMap.needsUpdate = true;

    console.log(`Updated material textures for segment ${segment.id}`);
  };

  // Configure road markings
  useEffect(() => {
    if (markingsRef.current && textures.markingsMap) {
      const material = markingsRef.current.material as THREE.MeshBasicMaterial;
      markingsMaterialRef.current = material;

      // Apply markings texture
      material.map = textures.markingsMap;
      material.transparent = true;
      material.opacity = 1.0; // Full opacity for markings, transparency is in the texture
      material.blending = THREE.NormalBlending; // Normal blending for proper transparency
      material.depthWrite = false; // Prevents z-fighting
      material.alphaTest = 0.01; // Only render pixels with some opacity

      // Set same repeat as the base texture for alignment
      if (textures.map?.repeat) {
        material.map.repeat.copy(textures.map.repeat);
      }

      material.needsUpdate = true;
      textures.markingsMap.needsUpdate = true;

      console.log(`Applied road markings texture for segment ${segment.id}`);
    }
  }, [textures.markingsMap, textures.map, segment.id]);

  // Set up debug visualization elements if in debug mode
  useEffect(() => {
    if (debug && meshRef.current) {
      // Handle different segment types with their connection structures
      if (isStraightSegment(segment) || isCurvedSegment(segment)) {
        const startConnection = segment.connections.start;
        const endConnection = segment.connections.end;

        // Calculate world positions for start/end markers
        const startWorld = new THREE.Vector3().copy(startConnection.position);
        const endWorld = new THREE.Vector3().copy(endConnection.position);

        if (startMarkerRef.current) {
          startMarkerRef.current.position.copy(startWorld);
          startMarkerRef.current.position.y += 0.2; // Elevate marker slightly above road
        }

        if (endMarkerRef.current) {
          endMarkerRef.current.position.copy(endWorld);
          endMarkerRef.current.position.y += 0.2; // Elevate marker slightly above road
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
      }
    }

    return undefined;
  }, [segment, debug, length]);

  // Animation for hover effect - only active in debug mode
  useFrame(() => {
    if (isHovered && meshRef.current && debug) {
      // Simple hover animation - only applies in debug mode
      const time = Date.now() * 0.001;
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material && 'emissive' in material) {
        material.emissive = new THREE.Color(0x333333).multiplyScalar(
          0.5 + Math.sin(time * 2) * 0.25
        );
      }
    } else if (!isHovered && meshRef.current) {
      // Reset emissive when not hovered
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material && 'emissive' in material) {
        material.emissive = debug
          ? new THREE.Color(0x222222)
          : new THREE.Color(0x000000);
      }
    }
  });

  // Helper function to render debug visualization based on segment type
  const renderDebugVisuals = () => {
    if (!debug) return null;

    if (isStraightSegment(segment) || isCurvedSegment(segment)) {
      const { start, end } = segment.connections;

      return (
        <group>
          {/* Start connection marker - positioned in world space */}
          <mesh ref={startMarkerRef} position={start.position}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color="green" transparent opacity={0.8} />
          </mesh>

          {/* End connection marker - positioned in world space */}
          <mesh ref={endMarkerRef} position={end.position}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color="red" transparent opacity={0.8} />
          </mesh>

          {/* Connection line */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={
                  new Float32Array([
                    start.position.x,
                    start.position.y + 0.2,
                    start.position.z,
                    end.position.x,
                    end.position.y + 0.2,
                    end.position.z,
                  ])
                }
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="yellow" linewidth={2} />
          </line>
        </group>
      );
    }

    return null;
  };

  // Enhanced texture debugger - shows actual loaded textures
  const renderTextureDebugger = () => {
    if (!(debug && process.env.NODE_ENV === 'development')) return null;

    // Show both base texture and markings texture in debug mode
    if (textures.map) {
      const baseTexturePosition: [number, number, number] = [
        position.x - 3,
        position.y + 5,
        position.z,
      ];

      const markingsTexturePosition: [number, number, number] = [
        position.x + 3,
        position.y + 5,
        position.z,
      ];

      return (
        <>
          <TextureDebugger
            texturePath={
              (textures.map as THREE.Texture).source?.data?.src ||
              'base texture'
            }
            position={baseTexturePosition}
            width={3}
            height={3}
          />
          {textures.markingsMap && (
            <TextureDebugger
              texturePath="road markings"
              position={markingsTexturePosition}
              width={3}
              height={3}
            />
          )}
        </>
      );
    }

    return null;
  };

  // Capture the material instance when the mesh is created
  const handleMeshCreated = (mesh: THREE.Mesh) => {
    if (mesh && mesh.material) {
      const material = mesh.material as THREE.MeshStandardMaterial;
      materialRef.current = material;

      // Apply textures immediately if they're already loaded
      if (texturesLoaded && textures.map) {
        updateMaterial(material);
      }
    }
  };

  return (
    <>
      {/* Apply the segment's position and rotation to the entire group */}
      <group
        position={[position.x, position.y, position.z]}
        rotation={[rotation.x, rotation.y, rotation.z]}
      >
        {/* Base road surface with asphalt texture */}
        <mesh
          ref={meshRef}
          onPointerOver={() => debug && setIsHovered(true)}
          onPointerOut={() => debug && setIsHovered(false)}
          receiveShadow
          onUpdate={(self) => handleMeshCreated(self)}
        >
          <planeGeometry args={[width, length]} />
          <meshStandardMaterial
            color={texturesLoaded && textures.map ? 0xffffff : '#555555'}
            map={textures.map}
            normalMap={textures.normalMap}
            roughnessMap={textures.roughnessMap}
            roughness={0.8}
            metalness={0.2}
            side={THREE.DoubleSide}
            emissive={debug ? new THREE.Color(0x222222) : undefined}
          />
        </mesh>

        {/* Road markings layer */}
        <mesh
          ref={markingsRef}
          position={[0, 0, 0.01]} // Slightly above the road surface
          receiveShadow={false}
        >
          <planeGeometry args={[width, length]} />
          <meshBasicMaterial
            transparent
            opacity={1.0}
            blending={THREE.NormalBlending}
            depthWrite={false}
            alphaTest={0.01}
            map={textures.markingsMap}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Debug visualization elements - positioned in world space */}
      {renderDebugVisuals()}

      {/* Enhanced texture debugger - shows actual loaded textures */}
      {debug && renderTextureDebugger()}
    </>
  );
};

// Type guard functions to check segment types
const isStraightSegment = (
  segment: RoadSegment
): segment is StraightRoadSegment => segment.type === 'straight';

const isCurvedSegment = (segment: RoadSegment): segment is CurvedRoadSegment =>
  segment.type === 'curve';
