import { useMemo } from 'react';
import { Vector2, CanvasTexture, RepeatWrapping, Texture } from 'three';
import { RoadSegment, RoadTextureOptions } from '../types/road.types';
import { RoadTextureLoader } from './road-texture.utils';

/**
 * Creates a canvas-based texture for road surfaces
 * @param type Type of texture to create (asphalt, markings, etc)
 * @param color Primary color of the texture
 * @param size Size of the canvas
 * @returns A CanvasTexture instance
 */
const createCanvasTexture = (
  type: 'asphalt' | 'markings-straight' | 'markings-curve' | 'markings-intersection' | 'markings-junction',
  color = '#333333',
  size = 256
): CanvasTexture => {
  // Create canvas and get context
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error('Could not get 2D context for canvas');
    throw new Error('Could not get 2D context for canvas');
  }

  // Fill with base color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  // Add texture details based on type
  switch (type) {
    case 'asphalt':
      // Create noise pattern for asphalt
      for (let i = 0; i < 10000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = Math.random() * 2;
        const alpha = Math.random() * 0.1;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fill();
      }

      // Add some larger gravel specks
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = Math.random() * 3 + 1;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, 0.3)`;
        ctx.fill();
      }
      break;

    case 'markings-straight':
      // Draw center line
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(size * 0.48, 0, size * 0.04, size);

      // Draw dashed side lines
      ctx.setLineDash([size * 0.1, size * 0.1]);
      ctx.lineWidth = size * 0.02;
      ctx.strokeStyle = '#ffffff';

      // Left lane marking
      ctx.beginPath();
      ctx.moveTo(size * 0.25, 0);
      ctx.lineTo(size * 0.25, size);
      ctx.stroke();

      // Right lane marking
      ctx.beginPath();
      ctx.moveTo(size * 0.75, 0);
      ctx.lineTo(size * 0.75, size);
      ctx.stroke();
      break;

    case 'markings-curve':
      // Draw curved center line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = size * 0.04;
      ctx.beginPath();
      ctx.arc(0, size, size * 0.9, -Math.PI/2, 0);
      ctx.stroke();

      // Draw curved dashed lines
      ctx.setLineDash([size * 0.08, size * 0.08]);
      ctx.lineWidth = size * 0.02;

      // Inner lane marking
      ctx.beginPath();
      ctx.arc(0, size, size * 0.7, -Math.PI/2, 0);
      ctx.stroke();

      // Outer lane marking
      ctx.beginPath();
      ctx.arc(0, size, size * 1.1, -Math.PI/2, 0);
      ctx.stroke();
      break;

    case 'markings-intersection':
      // Draw crosswalk lines
      ctx.fillStyle = '#ffffff';

      // Horizontal crosswalk
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(0, size * 0.3 + i * size * 0.1, size, size * 0.05);
      }

      // Vertical crosswalk
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(size * 0.3 + i * size * 0.1, 0, size * 0.05, size);
      }

      // Center dot
      ctx.beginPath();
      ctx.arc(size/2, size/2, size * 0.05, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'markings-junction':
      // Draw T-junction markings
      ctx.fillStyle = '#ffffff';

      // Main road center line
      ctx.fillRect(0, size * 0.48, size, size * 0.04);

      // Junction line
      ctx.fillRect(size * 0.48, 0, size * 0.04, size * 0.5);

      // Stop line
      ctx.fillRect(size * 0.3, size * 0.3, size * 0.4, size * 0.04);
      break;
  }

  // Create the texture
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;

  return texture;
};

/**
 * Creates a roughness map for road surfaces
 * @param intensity Roughness intensity (0-1)
 * @param size Size of the canvas
 * @returns A CanvasTexture instance
 */
const createRoughnessTexture = (intensity = 0.8, size = 256): CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get 2D context for canvas');
  }

  // Create a grayscale noise pattern
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Base roughness value
      let value = 0.5;

      // Add some random variation
      value += (Math.random() - 0.5) * 0.4 * intensity;

      // Add some perlin-like noise (simplified)
      const noiseX = Math.sin(x / 20) * Math.cos(y / 20) * 0.2 * intensity;
      value += noiseX;

      // Clamp value to 0-1 range
      value = Math.max(0, Math.min(1, value));

      // Convert to grayscale color
      const color = Math.floor(value * 255);

      // Set pixel
      ctx.fillStyle = `rgb(${color}, ${color}, ${color})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Create the texture
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;

  return texture;
};

/**
 * Default texture options for different road segment types
 */
const DEFAULT_TEXTURE_OPTIONS: Record<string, RoadTextureOptions> = {
  straight: {
    // Use just the filename - the resolver will handle the path
    roadTexture: 'asphalt.jpg',
    normalMap: 'asphalt_normal.png',
    roughnessMap: 'asphalt_roughness.png',
    repeat: new Vector2(1, 5)
  },
  curve: {
    roadTexture: 'asphalt.jpg',
    normalMap: 'asphalt_normal.png',
    roughnessMap: 'asphalt_roughness.png',
    repeat: new Vector2(1, 1)
  },
  intersection: {
    roadTexture: 'asphalt.jpg',
    normalMap: 'asphalt_normal.png',
    roughnessMap: 'asphalt_roughness.png',
    repeat: new Vector2(1, 1)
  },
  junction: {
    roadTexture: 'asphalt.jpg',
    normalMap: 'asphalt_normal.png',
    roughnessMap: 'asphalt_roughness.png',
    repeat: new Vector2(1, 1)
  }
};

/**
 * Interface defining the structure of road textures returned by useRoadTextures
 */
export type RoadTextures = {
  /** The main road surface texture */
  map: Texture | null;
  /** Optional normal map for surface detail */
  normalMap?: Texture | null;
  /** Roughness map for surface properties */
  roughnessMap: Texture | CanvasTexture;
  /** Road markings overlay texture */
  markingsMap: CanvasTexture | null;
};

/**
 * Hook to generate and prepare textures for a road segment
 * @param segment The road segment to generate textures for
 * @returns Object containing generated textures
 */
export const useRoadTextures = (segment: RoadSegment): RoadTextures => {
  return useMemo(() => {
    console.log('useRoadTextures called for segment:', segment.id, segment.type);

    // Create default texture options if none are provided
    const defaultOptions: RoadTextureOptions = {
      // Use just the filename - the resolver will handle the path
      roadTexture: 'asphalt.jpg',
      normalMap: 'asphalt_normal.png',
      roughnessMap: 'asphalt_roughness.png',
      repeat: new Vector2(1, segment.type === 'straight' ? 5 : 1)
    };

    // Determine texture options - use segment's options or fall back to defaults
    const textureOptions = segment.textureOptions || DEFAULT_TEXTURE_OPTIONS[segment.type] || defaultOptions;

    console.log('Texture options for segment:', segment.id, textureOptions);

    // Calculate repeat based on segment dimensions
    let repeat = textureOptions.repeat;
    if (!repeat) {
      if (segment.type === 'straight') {
        // For straight segments, set repeat based on length
        repeat = new Vector2(1, segment.length / 5);
      } else if (segment.type === 'curve') {
        // For curved segments, set repeat based on radius and angle
        const arcLength = segment.radius * segment.angle;
        repeat = new Vector2(1, arcLength / 5);
      } else {
        repeat = new Vector2(1, 1);
      }
    }

    // Create textures based on options
    let asphaltTexture = null;
    let normalMapTexture = null;
    let roughnessTexture = null;
    let markingsTexture = null;

    // Try to load from file first if path is provided
    if (textureOptions.roadTexture) {
      try {
        console.log('Attempting to load texture from:', textureOptions.roadTexture);
        asphaltTexture = RoadTextureLoader.loadTexture(textureOptions.roadTexture, repeat, textureOptions.rotation);
        console.log('Successfully loaded texture from file');
      } catch (error) {
        console.warn('Failed to load texture from file, falling back to procedural texture', error);
        asphaltTexture = null;
      }
    }

    // Try to load normal map texture if specified
    if (textureOptions.normalMap) {
      try {
        console.log('Attempting to load normal map from:', textureOptions.normalMap);
        normalMapTexture = RoadTextureLoader.loadTexture(textureOptions.normalMap, repeat, textureOptions.rotation);
        console.log('Successfully loaded normal map');
      } catch (error) {
        console.warn('Failed to load normal map, will continue without it', error);
        normalMapTexture = null;
      }
    }

    // Try to load roughness map texture if specified
    if (textureOptions.roughnessMap) {
      try {
        console.log('Attempting to load roughness map from:', textureOptions.roughnessMap);
        roughnessTexture = RoadTextureLoader.loadTexture(textureOptions.roughnessMap, repeat, textureOptions.rotation);
        console.log('Successfully loaded roughness map');
      } catch (error) {
        console.warn('Failed to load roughness map, falling back to procedural texture', error);
        roughnessTexture = null;
      }
    }

    // If file loading failed or no path was provided, create procedural texture
    if (!asphaltTexture) {
      console.log('Creating procedural asphalt texture for segment:', segment.id);
      asphaltTexture = createCanvasTexture('asphalt', '#333333');
      asphaltTexture.repeat.copy(repeat);
    }

    // If roughness map loading failed, create procedural one
    if (!roughnessTexture) {
      console.log('Creating procedural roughness texture for segment:', segment.id);
      roughnessTexture = createRoughnessTexture(0.8);
      roughnessTexture.repeat.copy(repeat);
    }

    // Generate appropriate markings texture based on segment type
    if (segment.type === 'straight') {
      markingsTexture = createCanvasTexture('markings-straight', '#ffffff');
    } else if (segment.type === 'curve') {
      markingsTexture = createCanvasTexture('markings-curve', '#ffffff');
    } else if (segment.type === 'intersection') {
      markingsTexture = createCanvasTexture('markings-intersection', '#ffffff');
    } else if (segment.type === 'junction') {
      markingsTexture = createCanvasTexture('markings-junction', '#ffffff');
    }

    if (markingsTexture) {
      markingsTexture.repeat.copy(repeat);
    }

    // If segment has rotation, apply it to all textures
    if (textureOptions.rotation) {
      asphaltTexture.rotation = textureOptions.rotation;
      if (normalMapTexture) normalMapTexture.rotation = textureOptions.rotation;
      if (roughnessTexture) roughnessTexture.rotation = textureOptions.rotation;
      if (markingsTexture) markingsTexture.rotation = textureOptions.rotation;
    }

    // Ensure texture.needsUpdate is true for all textures
    asphaltTexture.needsUpdate = true;
    if (normalMapTexture) normalMapTexture.needsUpdate = true;
    if (roughnessTexture) roughnessTexture.needsUpdate = true;
    if (markingsTexture) markingsTexture.needsUpdate = true;

    const result: RoadTextures = {
      map: asphaltTexture,
      normalMap: normalMapTexture,
      roughnessMap: roughnessTexture,
      markingsMap: markingsTexture
    };

    console.log('Textures created for segment:', segment.id,
      !!result.map, !!result.normalMap, !!result.roughnessMap, !!result.markingsMap);

    return result;
  }, [segment]);
};
