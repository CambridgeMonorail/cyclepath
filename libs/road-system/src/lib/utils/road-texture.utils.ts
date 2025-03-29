import { TextureLoader, RepeatWrapping, Vector2, Texture } from 'three';

/**
 * Asset paths configuration for the Cyclepath application
 */
const ASSET_CONFIG = {
  // Base path from Vite configuration
  BASE_URL: import.meta.env.BASE_URL || '/',

  // Default texture paths
  DEFAULT_TEXTURE_PATH: 'assets/textures/road/',
  DEFAULT_TEXTURE_FILE: 'asphalt.jpg'
};

/**
 * Utility to resolve proper asset paths across environments
 */
const resolveAssetPath = (path: string): string => {
  // If it's already a complete URL, return as is
  if (path.startsWith('http')) {
    return path;
  }

  // Extract just the filename if a full path is provided
  const filename = path.includes('/') ? path.split('/').pop() || '' : path;

  // Normalize the base URL (remove trailing slashes)
  const baseUrl = ASSET_CONFIG.BASE_URL.replace(/\/+$/, '');

  // If it's just a filename, use the default texture path
  if (!path.includes('/')) {
    return `${baseUrl}/${ASSET_CONFIG.DEFAULT_TEXTURE_PATH}${filename}`;
  }

  // For paths that include src/assets, convert to public asset paths
  if (path.includes('src/assets/')) {
    return `${baseUrl}/${path.replace('src/assets/', 'assets/')}`;
  }

  // If it's already a path starting with /assets, just add base URL
  if (path.startsWith('/assets/')) {
    return `${baseUrl}${path}`;
  }

  // If it's a path starting with assets/ (no leading slash), add base URL
  if (path.startsWith('assets/')) {
    return `${baseUrl}/${path}`;
  }

  // Default case: prepend base URL with proper slash handling
  return `${baseUrl}/${path.startsWith('/') ? path.substring(1) : path}`;
};

/**
 * Simplified texture loader utility class that leverages Three.js's capabilities
 */
export class RoadTextureLoader {
  private static textureLoader = new TextureLoader();
  private static textureCache: Record<string, Texture> = {};

  /**
   * Load a texture with proper configuration
   * Uses caching for performance optimization
   */
  public static loadTexture(path: string, repeat?: Vector2, rotation = 0): Texture {
    // Resolve the asset path with proper base URL handling
    const resolvedPath = resolveAssetPath(path);

    // Check for cached texture
    if (this.textureCache[resolvedPath]) {
      return this.textureCache[resolvedPath];
    }

    // Create new texture with proper configuration
    const texture = this.textureLoader.load(
      resolvedPath,
      // Success handler
      texture => {
        // Apply configurations
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;

        if (repeat) {
          texture.repeat.copy(repeat);
        }

        if (rotation !== 0) {
          texture.rotation = rotation;
        }

        // Store in cache
        this.textureCache[resolvedPath] = texture;
      },
      // Progress handler (unused)
      undefined,
      // Error handler - create fallback texture
      error => {
        console.warn(`Failed to load texture from ${resolvedPath}:`, error);
        // Use a procedural texture as fallback
        const fallbackTexture = this.createFallbackTexture(repeat, rotation);
        this.textureCache[resolvedPath] = fallbackTexture;
      }
    );

    // Apply initial configuration
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;

    if (repeat) {
      texture.repeat.copy(repeat);
    }

    if (rotation !== 0) {
      texture.rotation = rotation;
    }

    return texture;
  }

  /**
   * Creates a simple fallback texture when loading fails
   */
  private static createFallbackTexture(repeat?: Vector2, rotation = 0): Texture {
    // Create a canvas for the procedural texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Create a simple asphalt-like texture
      ctx.fillStyle = '#333333';
      ctx.fillRect(0, 0, 256, 256);

      // Add some noise
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = Math.random() * 2 + 0.5;
        ctx.fillStyle = `rgba(${40 + Math.random() * 30}, ${40 + Math.random() * 30}, ${40 + Math.random() * 30}, 0.4)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create texture from canvas
    const texture = new Texture(canvas);
    texture.needsUpdate = true;

    // Apply configuration
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;

    if (repeat) {
      texture.repeat.copy(repeat);
    }

    if (rotation !== 0) {
      texture.rotation = rotation;
    }

    return texture;
  }

  /**
   * Clear the texture cache to release memory
   */
  public static clearCache(): void {
    Object.values(this.textureCache).forEach(texture => texture.dispose());
    this.textureCache = {};
  }
}
