import { useThree } from '@react-three/fiber';
import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';

type SkyBoxProps = {
  /**
   * Path to the folder where the skybox images are stored
   * Images should be named: px.jpg, nx.jpg, py.jpg, ny.jpg, pz.jpg, nz.jpg
   */
  imagePath?: string;
  /**
   * Background color to use when no skybox is provided
   * Defaults to a light blue color
   */
  bottomColor?: string;
  /**
   * Size of the skybox mesh
   * Defaults to 1000 units
   */
  size?: number;
  /**
   * Optional callback that reports texture loading status
   */
  onLoadingStatus?: (status: { success: boolean; errors?: string[] }) => void;
};

/**
 * Properly typed TextureError for the error handling
 * This matches the structure of error objects returned by Three.js texture loading
 */
type TextureError = {
  type?: string;
  target?: {
    src?: string;
  };
  message?: string;
};

/**
 * Component that renders a skybox background using cube texture mapping.
 * The skybox can either use a set of 6 images or a solid color.
 */
export const SkyBox = ({
  imagePath = '/cyclepath/assets/textures/cambridge-skybox',
  bottomColor = '#87CEEB',
  size = 1000,
  onLoadingStatus,
}: SkyBoxProps) => {
  const { scene } = useThree();
  const [loadingFailed, setLoadingFailed] = useState(false);
  // Use ref to prevent duplicate skybox creation during development hot reloading
  const skyboxRef = useRef<THREE.Mesh | null>(null);
  const mountedRef = useRef(false);
  // Track loaded textures and errors
  const loadedTextureCountRef = useRef(0);
  const textureErrorsRef = useRef<string[]>([]);

  useEffect(() => {
    // Prevent duplicate effect execution due to StrictMode or hot reloading
    if (mountedRef.current) {
      return;
    }

    mountedRef.current = true;

    if (process.env.NODE_ENV === 'development') {
      console.log('SkyBox: Component mounted with', {
        imagePath,
        bottomColor,
        size,
        inDevMode: process.env.NODE_ENV === 'development',
      });
    }

    // Create a skybox mesh with the specified size
    const geometry = new THREE.BoxGeometry(size, size, size);
    // Flip the normals to face inward
    geometry.scale(-1, 1, 1);

    if (process.env.NODE_ENV === 'development') {
      console.log('SkyBox: Created box geometry with size', size);
    }

    let material: THREE.Material | THREE.Material[];
    let skybox: THREE.Mesh;
    let originalBackground = scene.background;

    // If an image path is provided, use a cube texture
    if (imagePath && !loadingFailed) {
      if (process.env.NODE_ENV === 'development') {
        console.log('SkyBox: Loading cube texture from path:', imagePath);
      }

      const loader = new THREE.CubeTextureLoader();

      // Log loading attempt for each texture face in development mode
      const textureFaces = [
        'px.jpg',
        'nx.jpg',
        'py.jpg',
        'ny.jpg',
        'pz.jpg',
        'nz.jpg',
      ];

      if (process.env.NODE_ENV === 'development') {
        console.log(
          'SkyBox: Loading texture faces:',
          textureFaces.map((face) => `${imagePath}/${face}`)
        );
      }

      try {
        // Reset texture tracking counters
        loadedTextureCountRef.current = 0;
        textureErrorsRef.current = [];

        const texture = loader.setPath(imagePath).load(
          textureFaces,
          // OnLoad callback - called for each texture face when loaded
          (loadedTexture) => {
            loadedTextureCountRef.current++;

            // Check if all 6 textures are loaded
            if (loadedTextureCountRef.current === 6) {
              if (process.env.NODE_ENV === 'development') {
                console.log('SkyBox: All textures successfully loaded');

                // Log image dimensions to verify correct loading
                if (loadedTexture.image) {
                  console.log('SkyBox: Texture dimensions:', {
                    width: loadedTexture.image.width,
                    height: loadedTexture.image.height,
                  });
                }
              }

              setLoadingFailed(false);

              // Call the onLoadingStatus callback if provided
              onLoadingStatus?.({ success: true });
            }
          },
          // OnProgress callback - only log in development
          process.env.NODE_ENV === 'development'
            ? (progress) => {
                if (progress.lengthComputable) {
                  const percentComplete =
                    (progress.loaded / progress.total) * 100;
                  console.log(
                    `SkyBox: Textures loading progress: ${Math.round(
                      percentComplete
                    )}%`
                  );
                }
              }
            : undefined,
          // OnError callback - use type assertion to handle the unknown error type
          (err: unknown) => {
            if (process.env.NODE_ENV === 'development') {
              console.error('SkyBox: Error loading textures:', err);
              console.log('SkyBox: Falling back to solid color background');
            }

            // Try to extract error information safely from the unknown type
            let errorSource = 'Unknown source';
            let errorMessage = 'Unknown texture loading error';

            // Handle different error types that might be returned by Three.js
            if (err && typeof err === 'object') {
              // Try to parse as TextureError or ErrorEvent
              const error = err as TextureError | ErrorEvent;

              // Extract source URL if available
              if ('target' in error && error.target && 'src' in error.target) {
                errorSource = error.target.src || errorSource;
              } else if ('currentTarget' in error && error.currentTarget) {
                const target = error.currentTarget as HTMLImageElement;
                errorSource = target.src || errorSource;
              }

              // Extract error message if available
              if ('message' in error && typeof error.message === 'string') {
                errorMessage = error.message;
              }
            }

            // Track error information for reporting
            textureErrorsRef.current.push(`${errorMessage} (${errorSource})`);

            // Only set loading failed if all textures failed or we have more than 3 failures
            if (textureErrorsRef.current.length > 3) {
              setLoadingFailed(true);

              // Call the onLoadingStatus callback if provided
              onLoadingStatus?.({
                success: false,
                errors: textureErrorsRef.current,
              });

              // Try fallback to solid color
              scene.background = new THREE.Color(bottomColor);
            }
          }
        );

        // Set the scene background
        originalBackground = scene.background;
        scene.background = texture;

        // Check if texture has valid data - a real indicator of success
        // This requires adding an event listener to the texture's source
        if (texture && texture.source) {
          const checkTextureValidity = () => {
            const images = texture.source.data;
            if (Array.isArray(images)) {
              const isValid = images.every(
                (img) => img && img.complete && img.width > 0 && img.height > 0
              );

              if (isValid) {
                if (process.env.NODE_ENV === 'development') {
                  console.log(
                    'SkyBox: Texture source verified as valid with dimensions:',
                    {
                      count: images.length,
                      dimensions: images
                        .map((img) => `${img.width}x${img.height}`)
                        .join(', '),
                    }
                  );
                }
              } else {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('SkyBox: Texture source verification failed');
                }
                setLoadingFailed(true);
              }
            }
          };

          // Check after a short delay to ensure images have loaded
          setTimeout(checkTextureValidity, 500);
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('SkyBox: Applied texture to scene background');
        }

        // Create a mesh with the texture
        material = new THREE.MeshBasicMaterial({
          envMap: texture,
          side: THREE.BackSide,
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('SkyBox: Created material with environment map');
        }

        // Create and add the skybox mesh to the scene
        skybox = new THREE.Mesh(geometry, material);
        skybox.rotation.y = 0; // Ensure we only rotate around Y axis per requirements
        skybox.rotation.x = 0; // Ensure flat alignment to XZ plane
        skybox.rotation.z = 0; // Ensure flat alignment to XZ plane
        scene.add(skybox);
        skyboxRef.current = skybox;

        if (process.env.NODE_ENV === 'development') {
          console.log('SkyBox: Added skybox mesh to scene');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(
            'SkyBox: Error setting up skybox with textures:',
            error
          );
        }
        setLoadingFailed(true);
        onLoadingStatus?.({
          success: false,
          errors: [
            error instanceof Error
              ? error.message
              : 'Unknown error setting up skybox',
          ],
        });
        // Continue to fallback implementation
      }
    }

    // Fallback to solid color if no image path, loading failed, or exception occurred
    if (!imagePath || loadingFailed || !skyboxRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('SkyBox: Using solid color:', bottomColor);
      }

      originalBackground = scene.background;
      scene.background = new THREE.Color(bottomColor);

      if (process.env.NODE_ENV === 'development') {
        console.log('SkyBox: Applied color to scene background');
      }

      // Create a simple colored skybox mesh
      material = new THREE.MeshBasicMaterial({
        color: bottomColor,
        side: THREE.BackSide,
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('SkyBox: Created material with solid color');
      }

      skybox = new THREE.Mesh(geometry, material);
      skybox.rotation.y = 0; // Ensure we only rotate around Y axis
      skybox.rotation.x = 0; // Ensure flat alignment to XZ plane
      skybox.rotation.z = 0; // Ensure flat alignment to XZ plane
      scene.add(skybox);
      skyboxRef.current = skybox;

      if (process.env.NODE_ENV === 'development') {
        console.log('SkyBox: Added solid-color skybox mesh to scene');
      }
    }

    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('SkyBox: Cleaning up resources...');
      }

      // Clean up - restore original background and remove mesh
      scene.background = originalBackground;

      if (skyboxRef.current) {
        scene.remove(skyboxRef.current);
        skyboxRef.current = null;
      }

      geometry.dispose();

      if (Array.isArray(material)) {
        material.forEach((mat) => mat.dispose());
      } else if (material) {
        material.dispose();
      }

      mountedRef.current = false;

      if (process.env.NODE_ENV === 'development') {
        console.log('SkyBox: Cleanup complete');
      }
    };
    // We deliberately omit most dependencies to prevent re-execution on every change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // No JSX needed as we create and manage the mesh imperatively
};

export default SkyBox;
