import { TextureLoader, RepeatWrapping, Vector2, Texture } from 'three';
import { RoadTextureOptions } from '../types/road.types';

/**
 * Asset paths configuration for the Cyclepath application
 * Handles both development and production environments including base URL
 */
const ASSET_CONFIG = {
  // Base path from Vite configuration - handles both local and deployed environments
  BASE_URL: import.meta.env.BASE_URL || '/',
  
  // Root path for assets
  ROAD_TEXTURES_PATH: 'assets/textures/road/',
  
  // Default texture filename
  DEFAULT_ASPHALT_TEXTURE: 'asphalt.jpg',
  
  // Development mode detection
  isDevelopment: import.meta.env.DEV
};

/**
 * Properly joins URL segments with correct slashes
 * @param segments URL path segments to join
 * @returns Properly formatted URL path
 */
const joinUrlSegments = (...segments: string[]): string => {
  return segments
    .map(segment => segment.replace(/^\/+|\/+$/g, '')) // Remove leading/trailing slashes
    .filter(Boolean) // Remove empty segments
    .join('/');
};

/**
 * Resolves asset paths for consistent loading across environments
 * @param path Original asset path
 * @returns Properly formatted URL including base path
 */
const resolveAssetPath = (path: string): string => {
  // If it's already an absolute URL (remote asset), leave it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Remove leading slash if present and extract filename
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const filename = cleanPath.split('/').pop() || '';
  
  // Get base URL (with trailing slash removed if present)
  const baseUrl = ASSET_CONFIG.BASE_URL.replace(/\/+$/, '');
  
  // For development server, we may need to adjust the path
  if (ASSET_CONFIG.isDevelopment) {
    // If path already has the correct structure, just ensure base URL is added
    if (cleanPath.includes('assets/textures/road/')) {
      return `${baseUrl}/${cleanPath}`;
    }
    
    // If it's just a filename, assume it's a road texture
    if (!cleanPath.includes('/')) {
      return `${baseUrl}/assets/textures/road/${filename}`;
    }
    
    // Handle paths that include src/assets
    if (cleanPath.includes('src/assets/')) {
      return `${baseUrl}/${cleanPath.replace('src/assets/', 'assets/')}`;
    }
    
    // Default approach - ensure base URL is prepended
    return `${baseUrl}/${cleanPath}`;
  }
  
  // Production build path handling
  if (cleanPath.includes('src/assets/')) {
    // Convert src/assets paths to public asset paths
    return `${baseUrl}/${cleanPath.replace('src/assets/', 'assets/')}`;
  } else if (cleanPath.startsWith('assets/')) {
    // Path already in correct format, just add base URL
    return `${baseUrl}/${cleanPath}`;
  } else if (!cleanPath.includes('/')) {
    // If it's just a filename, assume it's a road texture
    return `${baseUrl}/assets/textures/road/${filename}`;
  } else {
    // For any other path format, ensure base URL is prepended
    return `${baseUrl}/${cleanPath}`;
  }
};

/**
 * A utility class for loading and managing road textures with consistent
 * path resolution and robust fallback strategies
 */
export class RoadTextureLoader {
  private static textureLoader = new TextureLoader();
  private static textureCache: Record<string, Texture> = {};
  private static isLoadingTexture: Record<string, boolean> = {};
  private static textureLoadAttempts: Record<string, number> = {};
  private static readonly MAX_LOAD_ATTEMPTS = 2;
  private static readonly DEBUG = true;

  /**
   * Debug logging with consistent format and conditional execution
   */
  private static log(message: string, ...args: any[]): void {
    if (this.DEBUG) {
      console.log(`[RoadTextureLoader] ${message}`, ...args);
    }
  }

  /**
   * Load a texture with applied settings and robust fallback handling
   */
  public static loadTexture(path: string, repeat?: Vector2, rotation = 0): Texture {
    // Standardize texture path with base URL
    const resolvedPath = resolveAssetPath(path);
    const cacheKey = resolvedPath; // Use resolved path as cache key
    
    this.log(`Original path: ${path}, Resolved: ${resolvedPath}`);

    // Return cached texture if available
    if (this.textureCache[cacheKey]) {
      this.log(`Using cached texture for: ${resolvedPath}`);
      return this.textureCache[cacheKey];
    }

    // Prevent multiple simultaneous loads
    if (this.isLoadingTexture[cacheKey]) {
      this.log(`Already loading texture: ${resolvedPath}, returning placeholder`);
      // Return a placeholder texture if we're still loading
      const placeholder = this.createProceduralTexture('asphalt', repeat, rotation);
      return placeholder;
    }

    try {
      // Mark as loading and track attempts
      this.isLoadingTexture[cacheKey] = true;
      this.textureLoadAttempts[cacheKey] = (this.textureLoadAttempts[cacheKey] || 0) + 1;
      
      this.log(`Loading texture from: ${resolvedPath} (attempt ${this.textureLoadAttempts[cacheKey]}/${this.MAX_LOAD_ATTEMPTS})`);
      
      // Load the texture
      const texture = this.textureLoader.load(
        resolvedPath,
        // Success handler
        (loadedTexture) => {
          this.log(`Successfully loaded: ${resolvedPath}`);
          
          // Configure texture properties
          this.configureTexture(loadedTexture, repeat, rotation);
          
          // Cache the successful texture
          this.textureCache[cacheKey] = loadedTexture;
          this.isLoadingTexture[cacheKey] = false;
          this.textureLoadAttempts[cacheKey] = 0;
        },
        // Progress handler (unused)
        undefined,
        // Error handler
        (error) => {
          console.warn(`Error loading texture from ${resolvedPath}:`, error);
          
          // Development-specific fallback paths with base URL
          if (ASSET_CONFIG.isDevelopment && this.textureLoadAttempts[cacheKey] === 1) {
            const baseUrl = ASSET_CONFIG.BASE_URL.replace(/\/+$/, '');
            const filename = path.split('/').pop() || '';
            
            // Try these alternative paths with proper base URL
            let fallbackPaths = [
              // Try public directory path with base URL
              `${baseUrl}/assets/textures/road/${filename}`,
              // Try with base URL explicitly included
              joinUrlSegments(baseUrl, 'assets', 'textures', 'road', filename)
            ];
            
            // Find first fallback path that's different from what we just tried
            const fallbackPath = fallbackPaths.find(p => p !== resolvedPath);
            
            if (fallbackPath) {
              this.log(`First attempt failed. Trying development fallback path: ${fallbackPath}`);
              
              // Reset loading state
              this.isLoadingTexture[cacheKey] = false;
              
              // Try the fallback path
              setTimeout(() => {
                const fallbackTexture = this.loadTexture(fallbackPath, repeat, rotation);
                // If we loaded via fallback, also cache under the original path
                if (fallbackTexture !== this.createProceduralTexture()) {
                  this.textureCache[resolvedPath] = fallbackTexture;
                }
              }, 100);
              return;
            }
          }

          // Generic fallback attempt for any environment
          if (this.textureLoadAttempts[cacheKey] === 1) {
            // Extract filename and try with just the filename in standard location
            const filename = path.split('/').pop() || '';
            const fallbackPath = `/assets/textures/road/${filename}`;

            if (fallbackPath !== resolvedPath) {
              this.log(`First attempt failed. Trying fallback path: ${fallbackPath}`);

              // Reset loading state
              this.isLoadingTexture[cacheKey] = false;

              // Try the fallback path
              setTimeout(() => {
                this.loadTexture(fallbackPath, repeat, rotation);
              }, 100);
              return;
            }
          }

          // If all attempts have failed, use a procedural texture
          if (this.textureLoadAttempts[cacheKey] >= this.MAX_LOAD_ATTEMPTS) {
            console.warn(`Failed to load texture after ${this.MAX_LOAD_ATTEMPTS} attempts: ${resolvedPath}`);
            this.isLoadingTexture[cacheKey] = false;
            this.textureLoadAttempts[cacheKey] = 0;

            // Create and cache procedural texture
            const proceduralTexture = this.createProceduralTexture('asphalt', repeat, rotation);
            this.textureCache[cacheKey] = proceduralTexture;
          } else {
            // Retry with the same path
            this.log(`Retrying texture load (attempt ${this.textureLoadAttempts[cacheKey] + 1}/${this.MAX_LOAD_ATTEMPTS})...`);
            this.isLoadingTexture[cacheKey] = false;

            setTimeout(() => {
              this.loadTexture(resolvedPath, repeat, rotation);
            }, 1000);
          }
        }
      );
      
      // Initial configuration
      this.configureTexture(texture, repeat, rotation);
      return texture;
    } catch (error) {
      console.error("Unexpected error in texture loading:", error);
      this.isLoadingTexture[cacheKey] = false;
      
      // Return procedural texture for any errors
      return this.createProceduralTexture('asphalt', repeat, rotation);
    }
  }

  /**
   * Configure texture properties
   */
  private static configureTexture(texture: Texture, repeat?: Vector2, rotation = 0): void {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;

    if (repeat) {
      texture.repeat.copy(repeat);
    }

    if (rotation !== 0) {
      texture.rotation = rotation;
    }
  }

  /**
   * Creates and configures a procedural texture when image loading fails
   */
  private static createProceduralTexture(type = 'asphalt', repeat?: Vector2, rotation = 0): Texture {
    // Create a canvas for the procedural texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      if (type === 'asphalt') {
        // Create asphalt-like texture
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, 512, 512);

        // Add noise pattern
        for (let i = 0; i < 15000; i++) {
          const x = Math.random() * 512;
          const y = Math.random() * 512;
          const size = Math.random() * 2 + 0.5;
          const alpha = Math.random() * 0.3;

          ctx.fillStyle = `rgba(${30 + Math.random() * 30}, ${30 + Math.random() * 30}, ${30 + Math.random() * 30}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Add some road grit
        for (let i = 0; i < 300; i++) {
          const x = Math.random() * 512;
          const y = Math.random() * 512;
          const size = Math.random() * 3 + 1;

          ctx.fillStyle = `rgba(${60 + Math.random() * 40}, ${60 + Math.random() * 40}, ${60 + Math.random() * 40}, 0.7)`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Fallback checkerboard pattern
        ctx.fillStyle = '#555555';
        ctx.fillRect(0, 0, 512, 512);

        const tileSize = 64;
        ctx.fillStyle = '#777777';
        for (let y = 0; y < 512; y += tileSize) {
          for (let x = 0; x < 512; x += tileSize) {
            if ((x / tileSize + y / tileSize) % 2 === 0) {
              ctx.fillRect(x, y, tileSize, tileSize);
            }
          }
        }
      }
    }

    const texture = new Texture(canvas);
    texture.needsUpdate = true;

    // Configure properties
    this.configureTexture(texture, repeat, rotation);
    return texture;
  }

  /**
   * Handle WebGL context restoration by reloading textures
   */
  public static handleContextRestoration(): void {
    console.log("Reloading textures after context restoration...");

    // Force texture updates
    Object.values(this.textureCache).forEach(texture => {
      texture.needsUpdate = true;
    });
  }

  /**
   * Clear the texture cache
   */
  public static clearCache(): void {
    Object.values(this.textureCache).forEach(texture => texture.dispose());
    this.textureCache = {};
    this.isLoadingTexture = {};
    this.textureLoadAttempts = {};
  }
}
