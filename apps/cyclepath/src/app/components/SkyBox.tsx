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
 * Type definition for texture loading errors
 */
type TextureError = {
  type?: string;
  target?: {
    src?: string;
  };
  message?: string;
};

/**
 * Resolves possible paths for skybox textures based on the current environment
 * Prioritizes paths based on known successful patterns from road-texture.utils.ts
 */
const resolveSkyboxPaths = (basePath: string): string[] => {
  // Base URL from environment
  const baseUrl = import.meta.env.BASE_URL || '/';

  console.log('baseUrl', baseUrl);
  console.log('basePath', basePath);

  // If it's a full URL, return it directly
  if (basePath.startsWith('http')) {
    return [basePath];
  }

  // Normalize path - ensure it doesn't have trailing slash
  const normalizedPath = basePath.replace(/\/+$/, '');

  // Generate an array of possible paths to try - prioritizing paths that work for road textures
  return [
    // Priority 1: Direct paths with cyclepath prefix - these work for road textures
    `/cyclepath/assets/textures/cambridge-skybox`,

    // Priority 2: Localhost full URL path that worked in logs
    `http://localhost:4200/cyclepath/assets/textures/cambridge-skybox`,

    // Priority 3: Other cyclepath variations
    `/cyclepath${normalizedPath}`,
    `${window.location.origin}/cyclepath/assets/textures/cambridge-skybox`,

    // Lower priority: Standard direct paths
    normalizedPath,
    normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`,

    // Even lower priority: Other variations
    `/assets/textures/cambridge-skybox`,
    `assets/textures/cambridge-skybox`,
    `${baseUrl}/assets/textures/cambridge-skybox`,
  ].filter(Boolean); // Remove any empty entries
};

/**
 * Component that renders a skybox background using cube texture mapping.
 * The skybox can either use a set of 6 images or a solid color.
 */
export const SkyBox = ({
  imagePath = '/assets/textures/cambridge-skybox',
  bottomColor = '#87CEEB',
  size = 1000,
  onLoadingStatus,
}: SkyBoxProps) => {
  const { scene } = useThree();
  const [loadingFailed, setLoadingFailed] = useState(false);
  // Use refs to prevent duplicate skybox creation during development hot reloading
  const skyboxRef = useRef<THREE.Mesh | null>(null);
  const mountedRef = useRef(false);
  const loadedTextureCountRef = useRef(0);
  const textureErrorsRef = useRef<string[]>([]);
  const pathIndexRef = useRef(0);
  const pathsToTryRef = useRef<string[]>([]);

  // Initialize possible paths on first render
  if (pathsToTryRef.current.length === 0) {
    pathsToTryRef.current = resolveSkyboxPaths(imagePath);
  }

  useEffect(() => {
    // Prevent duplicate effect execution due to StrictMode or hot reloading
    if (mountedRef.current) {
      return;
    }

    mountedRef.current = true;

    if (process.env.NODE_ENV === 'development') {
      console.log('SkyBox: Component mounted with', {
        imagePath,
        pathsToTry: pathsToTryRef.current,
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
    let skybox: THREE.Mesh | null = null;
    let originalBackground = scene.background;

    // Try loading textures with path resolution fallback
    const tryLoadSkyboxTextures = (pathIndex: number) => {
      // If we've exhausted all paths, use the fallback color
      if (pathIndex >= pathsToTryRef.current.length || loadingFailed) {
        if (process.env.NODE_ENV === 'development') {
          console.log('SkyBox: Using solid color fallback:', bottomColor);
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

        return;
      }

      const currentPath = pathsToTryRef.current[pathIndex];

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `SkyBox: Trying path ${pathIndex + 1}/${
            pathsToTryRef.current.length
          }: ${currentPath}`
        );
      }

      // Reset texture tracking counters
      loadedTextureCountRef.current = 0;
      textureErrorsRef.current = [];

      const loader = new THREE.CubeTextureLoader();
      const textureFaces = [
        'px.jpg',
        'nx.jpg',
        'py.jpg',
        'ny.jpg',
        'pz.jpg',
        'nz.jpg',
      ];

      try {
        const texture = loader.setPath(currentPath + '/').load(
          textureFaces,
          // OnLoad callback - called for each texture face when loaded
          (loadedTexture) => {
            loadedTextureCountRef.current++;

            // Check if all 6 textures are loaded
            if (loadedTextureCountRef.current === 6) {
              if (process.env.NODE_ENV === 'development') {
                console.log(
                  `SkyBox: ✅ All textures successfully loaded from ${currentPath}`
                );

                // Log image dimensions to verify correct loading
                if (loadedTexture.image) {
                  console.log('SkyBox: Texture dimensions:', {
                    width: loadedTexture.image.width,
                    height: loadedTexture.image.height,
                  });
                }
              }

              // Store the successful path index for future reference
              pathIndexRef.current = pathIndex;
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
                    `SkyBox: Textures loading progress from ${currentPath}: ${Math.round(
                      percentComplete
                    )}%`
                  );
                }
              }
            : undefined,
          // OnError callback - use type assertion to handle the unknown error type
          (err: unknown) => {
            if (process.env.NODE_ENV === 'development') {
              /*               console.error(
                `SkyBox: ❌ Error loading texture from ${currentPath}:`,
                err
              ); */
            }

            // Try to extract error information safely from the unknown type
            let errorSource = 'Unknown source';

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
            }

            // Track error information for reporting
            textureErrorsRef.current.push(
              `Failed to load from ${currentPath} (${errorSource})`
            );

            // Try the next path
            if (process.env.NODE_ENV === 'development') {
              console.log(`SkyBox: Trying next path option...`);
            }
            tryLoadSkyboxTextures(pathIndex + 1);
          }
        );

        // Set the scene background
        originalBackground = scene.background;
        scene.background = texture;

        // Create a mesh with the texture
        material = new THREE.MeshBasicMaterial({
          envMap: texture,
          side: THREE.BackSide,
        });

        // Create and add the skybox mesh to the scene
        skybox = new THREE.Mesh(geometry, material);
        skybox.rotation.y = 0; // Ensure we only rotate around Y axis per requirements
        skybox.rotation.x = 0; // Ensure flat alignment to XZ plane
        skybox.rotation.z = 0; // Ensure flat alignment to XZ plane
        scene.add(skybox);
        skyboxRef.current = skybox;

        if (process.env.NODE_ENV === 'development') {
          console.log(
            `SkyBox: Added skybox mesh to scene using ${currentPath}`
          );
        }

        // Check if texture has valid data after a short delay
        setTimeout(() => {
          if (texture && texture.source) {
            const images = texture.source.data;
            if (Array.isArray(images)) {
              const isValid = images.every(
                (img) => img && img.complete && img.width > 0 && img.height > 0
              );

              if (isValid) {
                if (process.env.NODE_ENV === 'development') {
                  console.log(
                    `SkyBox: ✅ Texture source verified as valid from ${currentPath}`
                  );
                }
              } else {
                if (process.env.NODE_ENV === 'development') {
                  console.warn(
                    `SkyBox: ⚠️ Texture source verification failed for ${currentPath}`
                  );
                }
                // Try the next path if this one didn't actually work
                tryLoadSkyboxTextures(pathIndex + 1);
              }
            }
          }
        }, 500);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(
            `SkyBox: ❌ Exception when setting up skybox with textures from ${currentPath}:`,
            error
          );
        }
        // Try the next path
        tryLoadSkyboxTextures(pathIndex + 1);
      }
    };

    // Start trying to load from the first path
    tryLoadSkyboxTextures(0);

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
