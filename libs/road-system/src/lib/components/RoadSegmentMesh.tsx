import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CurvedRoadSegment, RoadSegment } from '../types/road.types';
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
  // Add ref for markings material
  const markingsMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

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
      if (markingsMaterialRef.current && textures.markingsMap) {
        markingsMaterialRef.current.needsUpdate = true;
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

  // Set the proper texture rotation for the road markings based on segment type
  useEffect(() => {
    if (markingsMaterialRef.current && textures.markingsMap) {
      const markingsTexture = textures.markingsMap;

      // For curves, we need to ensure the markings are properly oriented
      if (segment.type === 'curve') {
        // Get the curve-specific properties
        const curveSegment = segment as CurvedRoadSegment;
        const curveDirection = curveSegment.direction || 'right';
        const tileDirection = (segment as any).tileDirection;

        // Always set the texture's rotation center to the middle
        markingsTexture.center.set(0.5, 0.5);

        // Calculate texture rotation based on segment rotation
        const textureRotation = segment.rotation.y;

        // Log details about this curve segment for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log(`Processing curve segment ${segment.id}:`);
          console.log(
            `- Segment rotation: ${(
              (segment.rotation.y * 180) /
              Math.PI
            ).toFixed(1)}°`
          );
          console.log(`- Curve direction: ${curveDirection}`);
          console.log(`- Tile direction: ${tileDirection || 'not specified'}`);
        }

        // Apply the calculated rotation to the texture
        markingsTexture.rotation = textureRotation;

        // Force material update
        markingsMaterialRef.current.needsUpdate = true;

        if (process.env.NODE_ENV === 'development') {
          console.log(
            `Applied texture rotation: ${(
              (markingsTexture.rotation * 180) /
              Math.PI
            ).toFixed(1)}°`
          );
        }
      }
    }
  }, [segment, textures.markingsMap]);

  // Log detailed geometry information for debugging curve segments
  useEffect(() => {
    // Only run in development mode and only for curve segments
    if (
      process.env.NODE_ENV === 'development' &&
      segment.type === 'curve' &&
      textures.markingsMap
    ) {
      console.group(`Curve Segment Geometry Debug - ${segment.id}`);
      console.log(
        `Segment dimensions: width=${segment.width}, length=${segment.length}`
      );
      console.log(
        `Segment position: (${segment.position.x}, ${segment.position.y}, ${segment.position.z})`
      );
      console.log(
        `Segment rotation: (${segment.rotation.x}, ${segment.rotation.y}, ${segment.rotation.z})`
      );

      // Log texture details
      const markingsTexture = textures.markingsMap;
      console.log(`Markings texture details:`);
      console.log(
        `- Center: (${markingsTexture.center.x}, ${markingsTexture.center.y})`
      );
      console.log(
        `- Repeat: (${markingsTexture.repeat.x}, ${markingsTexture.repeat.y})`
      );
      console.log(
        `- Rotation: ${((markingsTexture.rotation * 180) / Math.PI).toFixed(
          1
        )}°`
      );

      // Log curve-specific properties
      const curveSegment = segment as CurvedRoadSegment;
      console.log(`Curve type: ${curveSegment.direction || 'right'}`);
      if ((segment as any).tileDirection) {
        console.log(`Tile direction: ${(segment as any).tileDirection}`);
      }

      console.groupEnd();
    }
  }, [segment, textures.markingsMap]);

  // Enhanced debug logging for curve texture mapping
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'development' &&
      segment.type === 'curve' &&
      textures.markingsMap
    ) {
      console.group(`Curve Texture Mapping Debug - ${segment.id}`);

      // Log segment properties
      console.log(
        `Segment dimensions: width=${segment.width}, length=${segment.length}`
      );
      console.log(
        `Segment position: (${segment.position.x.toFixed(
          2
        )}, ${segment.position.y.toFixed(2)}, ${segment.position.z.toFixed(2)})`
      );
      console.log(
        `Segment rotation: ${((segment.rotation.y * 180) / Math.PI).toFixed(
          1
        )}°`
      );

      // Log texture properties
      const markingsTexture = textures.markingsMap;
      console.log(`Texture properties:`);
      console.log(
        `- Size: ${markingsTexture.image.width}x${markingsTexture.image.height}`
      );
      console.log(
        `- Center point: (${markingsTexture.center.x}, ${markingsTexture.center.y})`
      );
      console.log(
        `- Rotation: ${((markingsTexture.rotation * 180) / Math.PI).toFixed(
          1
        )}°`
      );
      console.log(
        `- Repeat: (${markingsTexture.repeat.x}, ${markingsTexture.repeat.y})`
      );
      console.log(`- Wrap: ${markingsTexture.wrapS}, ${markingsTexture.wrapT}`);

      // Log curve-specific properties
      if (segment.type === 'curve') {
        const curveSegment = segment as CurvedRoadSegment;
        console.log(`Curve properties:`);
        console.log(`- Direction: ${curveSegment.direction || 'right'}`);
        console.log(`- Radius: ${curveSegment.radius}`);
        console.log(
          `- Angle: ${((curveSegment.angle * 180) / Math.PI).toFixed(1)}°`
        );
        if ((segment as any).tileDirection) {
          console.log(`- Tile direction: ${(segment as any).tileDirection}`);
        }
      }

      console.groupEnd();
    }
  }, [segment, textures.markingsMap]);

  // Add visual debug helpers for curve texture mapping
  useEffect(() => {
    if (!showDebug || !meshRef.current || segment.type !== 'curve') return;

    // Only show texture debug visualization in development mode
    if (process.env.NODE_ENV !== 'development') return;

    const currentMesh = meshRef.current;
    const debugObjects: THREE.Object3D[] = [];

    // Create a grid to visualize texture coordinates on the surface
    const segmentWidth = segment.width;
    const segmentLength = segment.length;

    // Calculate dimensions for a curved segment
    const curveSegment = segment as CurvedRoadSegment;
    const radius = curveSegment.radius;
    const angle = curveSegment.angle;

    // Create visual guides to show texture mapping boundaries
    const textureGridSize = 5; // Number of texture grid divisions to show

    // Create grid lines along the U direction (across width)
    for (let i = 0; i <= textureGridSize; i++) {
      const position = (i / textureGridSize) * segmentWidth - segmentWidth / 2;
      const gridLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(position, 0.1, -segmentLength / 2),
        new THREE.Vector3(position, 0.1, segmentLength / 2),
      ]);

      const gridLineMaterial = new THREE.LineBasicMaterial({
        color: i === 0 || i === textureGridSize ? 0xff3366 : 0x33aaff,
        linewidth: i === 0 || i === textureGridSize ? 2 : 1,
        transparent: true,
        opacity: 0.7,
      });

      const gridLine = new THREE.Line(gridLineGeometry, gridLineMaterial);
      currentMesh.add(gridLine);
      debugObjects.push(gridLine);

      // Add label for texture U coordinate using CSS2DObject instead of Text
      if (i % Math.ceil(textureGridSize / 5) === 0) {
        const uCoord = (i / textureGridSize).toFixed(1);

        const labelDiv = document.createElement('div');
        labelDiv.className = 'debug-label';
        labelDiv.textContent = `U: ${uCoord}`;
        labelDiv.style.color = '#33aaff';
        labelDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
        labelDiv.style.padding = '2px 4px';
        labelDiv.style.borderRadius = '2px';
        labelDiv.style.fontSize = '10px';

        const label = new CSS2DObject(labelDiv);
        label.position.set(position, 0.15, -segmentLength / 2 + 0.2);
        currentMesh.add(label);
        debugObjects.push(label);
      }
    }

    // Create grid lines along the V direction (along length)
    for (let i = 0; i <= textureGridSize; i++) {
      const position =
        (i / textureGridSize) * segmentLength - segmentLength / 2;
      const gridLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-segmentWidth / 2, 0.1, position),
        new THREE.Vector3(segmentWidth / 2, 0.1, position),
      ]);

      const gridLineMaterial = new THREE.LineBasicMaterial({
        color: i === 0 || i === textureGridSize ? 0xff3366 : 0x33aaff,
        linewidth: i === 0 || i === textureGridSize ? 2 : 1,
        transparent: true,
        opacity: 0.7,
      });

      const gridLine = new THREE.Line(gridLineGeometry, gridLineMaterial);
      currentMesh.add(gridLine);
      debugObjects.push(gridLine);

      // Add label for texture V coordinate using CSS2DObject
      if (i % Math.ceil(textureGridSize / 5) === 0) {
        const vCoord = (i / textureGridSize).toFixed(1);

        const labelDiv = document.createElement('div');
        labelDiv.className = 'debug-label';
        labelDiv.textContent = `V: ${vCoord}`;
        labelDiv.style.color = '#33aaff';
        labelDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
        labelDiv.style.padding = '2px 4px';
        labelDiv.style.borderRadius = '2px';
        labelDiv.style.fontSize = '10px';

        const label = new CSS2DObject(labelDiv);
        label.position.set(-segmentWidth / 2 + 0.2, 0.15, position);
        currentMesh.add(label);
        debugObjects.push(label);
      }
    }

    // Add texture boundary outline (red) - this represents the actual texture boundaries
    const outlineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-segmentWidth / 2, 0.12, -segmentLength / 2),
      new THREE.Vector3(segmentWidth / 2, 0.12, -segmentLength / 2),
      new THREE.Vector3(segmentWidth / 2, 0.12, segmentLength / 2),
      new THREE.Vector3(-segmentWidth / 2, 0.12, segmentLength / 2),
      new THREE.Vector3(-segmentWidth / 2, 0.12, -segmentLength / 2),
    ]);

    const outlineMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
    });

    const outline = new THREE.Line(outlineGeometry, outlineMaterial);
    currentMesh.add(outline);
    debugObjects.push(outline);

    // Add dimension labels using CSS2DObject
    const widthLabelDiv = document.createElement('div');
    widthLabelDiv.className = 'debug-label';
    widthLabelDiv.textContent = `Width: ${segmentWidth.toFixed(1)}`;
    widthLabelDiv.style.color = '#ff0000';
    widthLabelDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
    widthLabelDiv.style.padding = '2px 4px';
    widthLabelDiv.style.borderRadius = '2px';
    widthLabelDiv.style.fontSize = '12px';

    const widthLabel = new CSS2DObject(widthLabelDiv);
    widthLabel.position.set(0, 0.2, -segmentLength / 2 - 0.3);
    currentMesh.add(widthLabel);
    debugObjects.push(widthLabel);

    const lengthLabelDiv = document.createElement('div');
    lengthLabelDiv.className = 'debug-label';
    lengthLabelDiv.textContent = `Length: ${segmentLength.toFixed(1)}`;
    lengthLabelDiv.style.color = '#ff0000';
    lengthLabelDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
    lengthLabelDiv.style.padding = '2px 4px';
    lengthLabelDiv.style.borderRadius = '2px';
    lengthLabelDiv.style.fontSize = '12px';

    const lengthLabel = new CSS2DObject(lengthLabelDiv);
    lengthLabel.position.set(-segmentWidth / 2 - 0.3, 0.2, 0);
    // We can't rotate CSS2DObject directly, so we'll create a group for it
    const lengthLabelGroup = new THREE.Group();
    lengthLabelGroup.add(lengthLabel);
    lengthLabelGroup.rotation.y = Math.PI / 2;
    currentMesh.add(lengthLabelGroup);
    debugObjects.push(lengthLabelGroup);

    // Add a marker for the texture center
    const centerMarkerGeometry = new THREE.SphereGeometry(0.1);
    const centerMarkerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
    });
    const centerMarker = new THREE.Mesh(
      centerMarkerGeometry,
      centerMarkerMaterial
    );
    centerMarker.position.set(0, 0.15, 0);
    currentMesh.add(centerMarker);
    debugObjects.push(centerMarker);

    // Add a label for the center point using CSS2DObject
    const centerLabelDiv = document.createElement('div');
    centerLabelDiv.className = 'debug-label';
    centerLabelDiv.textContent = `Texture Center`;
    centerLabelDiv.style.color = '#ffff00';
    centerLabelDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
    centerLabelDiv.style.padding = '2px 4px';
    centerLabelDiv.style.borderRadius = '2px';
    centerLabelDiv.style.fontSize = '12px';

    const centerLabel = new CSS2DObject(centerLabelDiv);
    centerLabel.position.set(0, 0.3, 0);
    currentMesh.add(centerLabel);
    debugObjects.push(centerLabel);

    // For curves, add arc measurements
    if (segment.type === 'curve') {
      // Add arc radius visualization
      const radiusLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.11, 0),
        new THREE.Vector3(0, 0.11, radius),
      ]);

      const radiusLineMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 1,
        transparent: true,
        opacity: 0.7,
      });

      const radiusLine = new THREE.Line(radiusLineGeometry, radiusLineMaterial);
      currentMesh.add(radiusLine);
      debugObjects.push(radiusLine);

      // Label for radius using CSS2DObject
      const radiusLabelDiv = document.createElement('div');
      radiusLabelDiv.className = 'debug-label';
      radiusLabelDiv.textContent = `Radius: ${radius.toFixed(1)}`;
      radiusLabelDiv.style.color = '#00ff00';
      radiusLabelDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
      radiusLabelDiv.style.padding = '2px 4px';
      radiusLabelDiv.style.borderRadius = '2px';
      radiusLabelDiv.style.fontSize = '12px';

      const radiusLabel = new CSS2DObject(radiusLabelDiv);
      radiusLabel.position.set(0, 0.25, radius / 2);
      currentMesh.add(radiusLabel);
      debugObjects.push(radiusLabel);

      // Label for angle using CSS2DObject
      const angleLabelDiv = document.createElement('div');
      angleLabelDiv.className = 'debug-label';
      angleLabelDiv.textContent = `Angle: ${((angle * 180) / Math.PI).toFixed(
        1
      )}°`;
      angleLabelDiv.style.color = '#00ff00';
      angleLabelDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
      angleLabelDiv.style.padding = '2px 4px';
      angleLabelDiv.style.borderRadius = '2px';
      angleLabelDiv.style.fontSize = '12px';

      const angleLabel = new CSS2DObject(angleLabelDiv);
      angleLabel.position.set(0, 0.25, -radius / 2);
      currentMesh.add(angleLabel);
      debugObjects.push(angleLabel);
    }

    // Cleanup function
    return () => {
      debugObjects.forEach((obj) => {
        currentMesh.remove(obj);
        if (obj instanceof THREE.Line || obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
    };
  }, [segment, showDebug, textures.markingsMap]);

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
              ref={markingsMaterialRef}
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
