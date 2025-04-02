import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

type SkyBoxProps = {
  /**
   * Size of the skybox cube
   * @default 1000
   */
  size?: number;

  /**
   * Quality level for the skybox rendering
   * @default "high"
   */
  quality?: 'low' | 'medium' | 'high';
};

/**
 * SkyBox component that creates a 3D environment cube around the scene.
 * Uses the Cambridge-themed skybox textures with optimized loading based on quality level.
 */
const SkyBox = ({ size = 1000, quality = 'high' }: SkyBoxProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Determine geometry complexity based on quality level
  // Lower quality = fewer segments = better performance
  const segments = useMemo(() => {
    return quality === 'low' ? 8 : quality === 'medium' ? 16 : 32;
  }, [quality]);

  // Memoize the loading of skybox textures
  const skyboxTextures = useMemo(() => {
    // Create the cube texture loader
    const loader = new THREE.CubeTextureLoader();

    // Set path to the skybox textures
    loader.setPath('/assets/textures/cambridge-skybox/');

    // Load the 6 textures of the cube
    const texture = loader.load([
      'px.jpg', // right
      'nx.jpg', // left
      'py.jpg', // top
      'ny.jpg', // bottom
      'pz.jpg', // front
      'nz.jpg', // back
    ]);

    // Apply texture settings based on quality
    texture.generateMipmaps = quality !== 'low';
    texture.minFilter =
      quality === 'low' ? THREE.NearestFilter : THREE.LinearMipmapLinearFilter;
    texture.magFilter =
      quality === 'low' ? THREE.NearestFilter : THREE.LinearFilter;

    // Set anisotropy based on quality level if it's not low quality
    if (quality !== 'low') {
      try {
        // Get the renderer's capabilities for anisotropy
        const anisotropyLevel = quality === 'medium' ? 4 : 8;
        // Set a reasonable anisotropy value based on quality
        texture.anisotropy = anisotropyLevel;
      } catch (e) {
        console.warn('Anisotropic filtering not supported:', e);
      }
    }

    return texture;
  }, [quality]);

  // Apply frustum culling optimization
  useEffect(() => {
    if (meshRef.current) {
      // Disable frustum culling for skybox since it's always visible
      // This avoids unnecessary frustum culling calculations
      meshRef.current.frustumCulled = false;
    }
  }, []);

  // Optimize skybox rendering by ensuring it follows the camera without full matrix calculation
  useFrame(({ camera }) => {
    if (meshRef.current) {
      // Update position to follow camera without full matrix calculations
      meshRef.current.position.copy(camera.position);
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* Use a BoxGeometry with reversed normals for the skybox
          Adjust segment count based on quality */}
      <boxGeometry args={[size, size, size, segments, segments, segments]} />

      {/* Create the skybox material with optimized settings */}
      <meshBasicMaterial
        side={THREE.BackSide} // Render the inside of the cube
        envMap={skyboxTextures}
        depthWrite={false} // Don't write to depth buffer for performance
        depthTest={true} // But still test against depth buffer
        toneMapped={false} // Preserve HDR values
        fog={false} // Disable fog calculations for skybox
      />
    </mesh>
  );
};

export default React.memo(SkyBox);
