import { useThree } from '@react-three/fiber';
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

type SkyBoxProps = {
  /**
   * Color at the top of the sky (zenith)
   * @default "#1E40AF" (deep blue)
   */
  topColor?: string;

  /**
   * Color at the bottom of the sky (horizon)
   * @default "#60A5FA" (lighter blue)
   */
  bottomColor?: string;

  /**
   * Size of the skybox
   * @default 1000
   */
  size?: number;
};

/**
 * A simple skybox component that creates a gradient background for the game world.
 * Uses a large box with a gradient shader material.
 */
export const SkyBox = ({
  topColor = '#1E40AF', // Default to deep blue
  bottomColor = '#60A5FA', // Default to lighter blue
  size = 1000,
}: SkyBoxProps) => {
  const { scene } = useThree();

  // Create and configure the shader material once
  const skyMaterial = useMemo(() => {
    // Create a shader material with vertical gradient
    return new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(topColor) },
        bottomColor: { value: new THREE.Color(bottomColor) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;

        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;

        void main() {
          // Normalize the y component to create gradient
          float h = normalize(vWorldPosition).y;
          // Mix between bottom and top colors based on y position
          gl_FragColor = vec4(mix(bottomColor, topColor, max(0.0, h)), 1.0);
        }
      `,
      side: THREE.BackSide, // Render on the inside of the box
      depthWrite: false, // Don't write to depth buffer
    });
  }, [topColor, bottomColor]);

  // Set the scene background color to match the bottom color
  useEffect(() => {
    const originalBackground = scene.background;
    // We don't set the scene.background here to avoid conflicts with our skybox

    return () => {
      scene.background = originalBackground;
    };
  }, [scene, bottomColor]);

  return (
    <mesh renderOrder={-1000}>
      <boxGeometry args={[size, size, size]} />
      <primitive object={skyMaterial} attach="material" />
    </mesh>
  );
};

export default SkyBox;
