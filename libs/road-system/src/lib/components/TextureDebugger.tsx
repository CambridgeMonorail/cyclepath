import { Text } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import * as THREE from 'three';

/**
 * Props for the TextureDebugger component
 */
type TextureDebuggerProps = {
  /**
   * Path to the texture file to display
   */
  texturePath: string;
  /**
   * Position of the debugger in 3D space
   */
  position?: [number, number, number];
  /**
   * Width of the texture display plane
   */
  width?: number;
  /**
   * Height of the texture display plane
   */
  height?: number;
  /**
   * Optional callback when texture is clicked
   */
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
};

/**
 * A component that displays a texture on a plane for debugging purposes.
 * This component is only active in development mode and helps visualize
 * textures for road segments.
 */
export const TextureDebugger = ({
  texturePath,
  position = [0, 5, 0],
  width = 5,
  height = 5,
  onClick,
}: TextureDebuggerProps) => {
  // State to track loading status and errors
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load texture manually to have full control over the process
  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();

    // Track the texture being loaded in this effect instance
    let currentTexture: THREE.Texture | null = null;

    setIsLoading(true);

    textureLoader.load(
      texturePath,
      // Success callback
      (loadedTexture) => {
        // Configure texture properly for PBR workflow
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        loadedTexture.needsUpdate = true;

        currentTexture = loadedTexture;
        setTexture(loadedTexture);
        setIsLoading(false);
        setError(null);

        console.log(`✅ Texture loaded successfully: ${texturePath}`);
      },
      // Progress callback - unused but required by the API
      undefined,
      // Error callback with proper typing for THREE.TextureLoader
      (err: unknown) => {
        console.error(`❌ Failed to load texture: ${texturePath}`, err);

        // Extract error message safely regardless of error type
        let errorMessage = 'Unknown texture loading error';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else if (err && typeof err === 'object' && 'message' in err) {
          errorMessage = String((err as { message: unknown }).message);
        }

        setError(errorMessage);
        setIsLoading(false);

        // Create fallback texture for error state
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Create a visual error indicator
          ctx.fillStyle = '#FF3333';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Add error text
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('ERROR', canvas.width / 2, canvas.height / 2);
          ctx.font = '16px Arial';
          ctx.fillText('Texture not found', canvas.width / 2, canvas.height / 2 + 30);
        }

        const errorTexture = new THREE.CanvasTexture(canvas);
        errorTexture.needsUpdate = true;
        currentTexture = errorTexture;
        setTexture(errorTexture);
      }
    );

    // Cleanup function
    return () => {
      if (currentTexture) {
        currentTexture.dispose();
      }
    };
  }, [texturePath]); // Only depend on texturePath, currentTexture is managed within effect

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <group position={position}>
      {/* Texture display plane */}
      <mesh onClick={onClick}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture || undefined}
          side={THREE.DoubleSide}
          color={isLoading ? '#666666' : undefined}
        />
      </mesh>

      {/* Loading indicator */}
      {isLoading && (
        <group position={[0, 0, 0.01]}>
          <mesh>
            <planeGeometry args={[width * 0.7, height * 0.2]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.7} />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            Loading...
          </Text>
        </group>
      )}

      {/* Texture info label */}
      <group position={[0, height / 2 + 0.3, 0]}>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[width, 0.6]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.7} />
        </mesh>
        <Text
          position={[0, 0, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={width - 0.2}
        >
          {error ? `Error: ${error}` : texturePath}
        </Text>
      </group>
    </group>
  );
};
