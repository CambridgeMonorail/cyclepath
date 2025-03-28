import {
  TextureLoader,
  RepeatWrapping,
  Vector2,
  Texture,
  SRGBColorSpace,
} from 'three';

/**
 * Asset paths configuration for the Cyclepath application
 */
const ASSET_CONFIG = {
  // Base path from Vite configuration
  BASE_URL: import.meta.env.BASE_URL || '/',

  // Default texture paths - using public assets folder for production builds
  DEFAULT_TEXTURE_PATH: 'assets/textures/road/',
  DEFAULT_TEXTURE_FILE: 'asphalt.jpg',

  // Prioritize these paths when loading textures (most likely to work first)
  PRIORITY_PATHS: [
    // Direct path from root - works in production builds with copied assets
    '/assets/textures/road/',
    // Path with trailing slash - needed for some URL construction cases
    'assets/textures/road/',
  ],
};

/**
 * Utility to resolve proper asset paths across environments
 */
const resolveAssetPath = (path: string): string[] => {
  // If it's already a complete URL, return just that
  if (path.startsWith('http')) {
    return [path];
  }

  // Extract just the filename if a full path is provided
  const filename = path.includes('/') ? path.split('/').pop() || '' : path;

  // If BASE_URL has a trailing slash, normalize it
  const baseUrl = ASSET_CONFIG.BASE_URL.replace(/\/+$/, '');

  // Add debug logging for resolving texture paths
  console.log(`Resolving texture path: "${path}" -> filename: "${filename}"`);
  console.log(`Current BASE_URL: "${baseUrl}"`);

  // If it's just a filename without path, try multiple path variations
  if (!path.includes('/')) {
    // Build a list of possible paths to try - ordered by priority/likelihood
    const possiblePaths = [
      // Direct root paths - often work in production builds
      `/assets/textures/road/${filename}`,
      `assets/textures/road/${filename}`,

      // With BASE_URL prefix - important for GitHub Pages deployments
      `${baseUrl}/assets/textures/road/${filename}`,
      baseUrl ? `${baseUrl}assets/textures/road/${filename}` : '',

      // Alternative paths that might work in different environments
      `/cyclepath/assets/textures/road/${filename}`,
      `cyclepath/assets/textures/road/${filename}`,

      // Fallback paths for local dev environments
      `public/assets/textures/road/${filename}`,
      `src/assets/textures/road/${filename}`,
    ].filter(Boolean); // Remove empty strings

    console.log(`Will try these paths for ${filename}:`, possiblePaths);
    return possiblePaths;
  }

  // For paths that include src/assets, convert to public asset paths
  if (path.includes('src/assets/')) {
    return [
      `/assets/${path.split('src/assets/')[1]}`,
      `assets/${path.split('src/assets/')[1]}`,
      `${baseUrl}/assets/${path.split('src/assets/')[1]}`,
      path, // Keep original as fallback
    ];
  }

  // If it's already a path starting with /assets, add variations with and without base URL
  if (path.startsWith('/assets/')) {
    return [
      path, // Try original first
      path.substring(1), // Without leading slash
      `${baseUrl}${path}`, // With base URL
    ];
  }

  // If it's a path starting with assets/ (no leading slash), add variations
  if (path.startsWith('assets/')) {
    return [
      `/${path}`, // With leading slash
      path, // Original
      `${baseUrl}/${path}`, // With base URL and separator
      `${baseUrl}${path}`, // With base URL, no separator
    ];
  }

  // Default case: try multiple variations
  return [
    `/${path.startsWith('/') ? path.substring(1) : path}`, // With leading slash
    path, // Original
    `${baseUrl}/${path.startsWith('/') ? path.substring(1) : path}`, // With base URL
  ];
};

/**
 * Try loading a texture from multiple path variations
 * Sometimes the path resolution is tricky based on build/dev environment
 */
const tryLoadingFromVariations = (
  paths: string[],
  textureLoader: TextureLoader,
  onLoad: (texture: Texture) => void,
  onError: (error: ErrorEvent) => void
): void => {
  console.log(`Will try loading texture from these paths:`, paths);

  // Function to try loading from the next path in the array
  const tryNextPath = (index: number) => {
    if (index >= paths.length) {
      console.error(`❌ Exhausted all path variations`);
      onError(
        new ErrorEvent('error', {
          message: 'Failed to load from all path variations',
        })
      );
      return;
    }

    const currentPath = paths[index];
    console.log(`Loading texture from: ${currentPath}`);

    textureLoader.load(
      currentPath,
      // Success handler
      (texture) => {
        console.log(`✅ Successfully loaded texture from: ${currentPath}`);

        // CRITICAL FIX: Ensure the texture is properly configured immediately upon loading
        texture.needsUpdate = true;
        texture.colorSpace = SRGBColorSpace;
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;

        // Additional check to ensure image data is available and valid
        if (texture.image) {
          console.log(
            `Texture image dimensions: ${texture.image.width}x${texture.image.height}`
          );

          // Check for zero dimensions which might indicate loading issues
          if (texture.image.width === 0 || texture.image.height === 0) {
            console.warn(
              `⚠️ Texture loaded with zero dimensions from: ${currentPath}`
            );
            tryNextPath(index + 1);
            return;
          }
        } else {
          console.warn(
            `⚠️ Texture loaded without image data from: ${currentPath}`
          );
          tryNextPath(index + 1);
          return;
        }

        onLoad(texture);
      },
      // Progress handler (unused)
      undefined,
      // Error handler - try next path
      (error) => {
        console.warn(
          `⚠️ Failed to load from ${currentPath}, trying next path...`,
          error
        );
        tryNextPath(index + 1);
      }
    );
  };

  // Start trying from the first path
  tryNextPath(0);
};

/**
 * Simplified texture loader utility class that leverages Three.js's capabilities
 */
export class RoadTextureLoader {
  private static textureLoader = new TextureLoader();
  private static textureCache: Record<string, Texture> = {};
  private static texturePaths: Record<string, string> = {}; // Track which path succeeded
  private static isInitialized = false;

  /**
   * Initialize the loader and test paths to find the correct one for this environment
   */
  private static initialize() {
    if (this.isInitialized) return;

    console.log(
      `Initializing RoadTextureLoader with BASE_URL: ${
        import.meta.env.BASE_URL || '/'
      }`
    );
    console.log(`Running in env: ${import.meta.env.MODE || 'unknown'}`);

    // Test load the default texture to warm up path resolution cache
    this.isInitialized = true;
  }

  /**
   * Load a texture with proper configuration
   * Uses caching for performance optimization
   */
  public static loadTexture(
    path: string,
    repeat?: Vector2,
    rotation = 0
  ): Texture {
    this.initialize();

    // Important: ensure the path is not empty
    if (!path) {
      console.warn('❌ Texture path is empty, using default asphalt texture');
      path = ASSET_CONFIG.DEFAULT_TEXTURE_FILE;
    }

    // Get a uniform cache key for this texture (just the filename)
    const cacheKey = path.includes('/') ? path.split('/').pop() || path : path;

    // Check if we have a successful path cached for this texture
    const knownWorkingPath = this.texturePaths[cacheKey];

    // Resolve all possible asset paths to try
    const pathsToTry = knownWorkingPath
      ? [knownWorkingPath] // Try the known working path first if we have one
      : resolveAssetPath(path);

    // Check for cached texture - but verify it has a valid image
    if (this.textureCache[cacheKey]) {
      const cachedTexture = this.textureCache[cacheKey];

      // Check if the cached texture has valid image data
      if (
        cachedTexture.image &&
        cachedTexture.image.width > 0 &&
        cachedTexture.image.height > 0
      ) {
        console.log(`Using cached texture for: ${cacheKey}`);

        // Update repeat and rotation if needed, even for cached textures
        if (repeat) {
          cachedTexture.repeat.copy(repeat);
        }
        if (rotation !== 0) {
          cachedTexture.rotation = rotation;
        }

        return cachedTexture;
      } else {
        console.warn(
          `Cached texture for ${cacheKey} has invalid image data, reloading`
        );
        // Don't return the cached texture if it doesn't have valid image data
        delete this.textureCache[cacheKey];
        delete this.texturePaths[cacheKey];
      }
    }

    console.log(`Creating new texture for: ${cacheKey}`);

    // Create a preliminary texture to return immediately (will be updated when loaded)
    const texture = new Texture();
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.colorSpace = SRGBColorSpace;

    if (repeat) {
      texture.repeat.copy(repeat);
    }

    if (rotation !== 0) {
      texture.rotation = rotation;
    }

    // Try loading from different path variations
    tryLoadingFromVariations(
      pathsToTry,
      this.textureLoader,
      // Success handler - update the texture we already returned
      (loadedTexture) => {
        // Copy important properties to our texture
        texture.image = loadedTexture.image;
        texture.source = loadedTexture.source;
        texture.needsUpdate = true;

        // Now that it's successfully loaded, cache it
        this.textureCache[cacheKey] = texture;

        // Store the path that worked for future reference
        if (loadedTexture.source?.data?.src) {
          this.texturePaths[cacheKey] = loadedTexture.source.data.src;
          console.log(
            `✅ Remembered working path for ${cacheKey}: ${loadedTexture.source.data.src}`
          );
        }

        console.log(`✅ Texture loaded successfully for: ${cacheKey}`, {
          dimensions: `${texture.image?.width}x${texture.image?.height}`,
          colorSpace: texture.colorSpace,
          repeat: repeat ? `${repeat.x}x${repeat.y}` : 'none',
          src: loadedTexture.source?.data?.src || 'unknown',
        });
      },
      // Error handler after all variations fail - create fallback texture
      (error) => {
        console.error(
          `❌ Failed to load texture from any path variation for ${cacheKey}:`,
          error
        );

        // Create a canvas element for the fallback texture
        const canvas = this.createFallbackTextureCanvas(cacheKey);

        // Apply the canvas to our texture
        texture.image = canvas;
        texture.needsUpdate = true;

        // Cache the fallback texture
        this.textureCache[cacheKey] = texture;

        console.log('Created fallback texture for:', cacheKey);
      }
    );

    return texture;
  }

  /**
   * Creates a simple fallback texture canvas when loading fails
   */
  private static createFallbackTextureCanvas(
    filename: string
  ): HTMLCanvasElement {
    // Create a canvas for the procedural texture
    const canvas = document.createElement('canvas');
    canvas.width = 512; // Increased size for better detail
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Make a more identifiable texture pattern with "FALLBACK" text
      ctx.fillStyle = '#555555'; // Lighter base color
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add some noise for asphalt-like appearance
      for (let i = 0; i < 10000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 3 + 0.5;
        const brightness = 60 + Math.random() * 40; // Brighter noise
        ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.5)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add some larger gravel specks
      for (let i = 0; i < 500; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 4 + 1;
        const brightness = 70 + Math.random() * 40;
        ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.7)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add a crosshatch pattern to make it more obvious this is a fallback
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 3;
      const step = 30;
      for (let i = 0; i < canvas.width; i += step) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += step) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Add a warning border to indicate this is a fallback texture
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 16;
      ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

      // Add text label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FALLBACK', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText('TEXTURE', canvas.width / 2, canvas.height / 2 + 30);

      // Add the filename that failed
      ctx.font = 'italic 24px Arial';
      ctx.fillStyle = '#ffaaaa';
      ctx.fillText(
        `Failed to load: ${filename}`,
        canvas.width / 2,
        canvas.height - 80
      );
      ctx.fillText(
        'Check browser console for details',
        canvas.width / 2,
        canvas.height - 50
      );
    }

    return canvas;
  }

  /**
   * Clear the texture cache to release memory
   */
  public static clearCache(): void {
    Object.values(this.textureCache).forEach((texture) => texture.dispose());
    this.textureCache = {};
    this.texturePaths = {};
    this.isInitialized = false;
    console.log('⚡ Texture cache cleared');
  }

  /**
   * For debugging - dump the current state of the texture cache
   */
  public static debugCache(): void {
    console.log('=== Texture Cache Debug ===');
    console.log('Cached textures:', Object.keys(this.textureCache).length);
    console.log('Cache entries:', Object.keys(this.textureCache));
    console.log('Known good paths:', this.texturePaths);
    console.log('=========================');
  }
}
