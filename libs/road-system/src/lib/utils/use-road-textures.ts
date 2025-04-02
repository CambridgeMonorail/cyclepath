import { useMemo } from 'react';
import {
  Vector2,
  CanvasTexture,
  RepeatWrapping,
  Texture,
  SRGBColorSpace,
} from 'three';
import {
  RoadSegment,
  RoadTextureOptions,
  CurvedRoadSegment,
} from '../types/road.types';
import { RoadTextureLoader } from './road-texture.utils';

/**
 * Creates a canvas-based texture for road surfaces
 * @param type Type of texture to create (asphalt, markings, etc)
 * @param color Primary color of the texture
 * @param size Size of the canvas
 * @param options Additional options for texture creation (rotation, direction)
 * @returns A CanvasTexture instance
 */
const createCanvasTexture = (
  type:
    | 'asphalt'
    | 'markings-straight'
    | 'markings-curve'
    | 'markings-intersection'
    | 'markings-junction',
  color = '#333333',
  size = 256,
  options?: {
    rotation?: number;
    curveDirection?: 'left' | 'right';
  }
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

  // Initialize the canvas differently based on texture type
  if (type === 'asphalt') {
    // Fill with base color for asphalt
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
  } else {
    // For road markings, start with a transparent canvas
    ctx.clearRect(0, 0, size, size);
  }

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
        ctx.fillStyle = `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(
          Math.random() * 100
        )}, ${Math.floor(Math.random() * 100)}, 0.3)`;
        ctx.fill();
      }
      break;

    case 'markings-straight':
      // Draw center line - solid double yellow
      ctx.fillStyle = '#FFDD00';
      ctx.fillRect(size * 0.48, 0, size * 0.04, size);

      // Draw dashed white side lines
      ctx.setLineDash([size * 0.15, size * 0.25]); // Longer dashes, greater spacing
      ctx.lineWidth = size * 0.025;
      ctx.strokeStyle = '#FFFFFF';

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

    case 'markings-curve': {
      // Save the canvas state before transformations
      ctx.save();

      // For curves, we need to handle the orientation more carefully
      // Default curve is a 90-degree turn from north to east
      const curveDirection = options?.curveDirection || 'right';

      // Clear the entire canvas and set a transparent background
      ctx.clearRect(0, 0, size, size);

      // Enhanced debug visualization with more detailed grid and alignment markers
      if (process.env.NODE_ENV === 'development') {
        // Draw a light grid with labeled coordinates
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
        ctx.lineWidth = 1;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';

        // Create an enhanced grid
        const gridStep = size / 10;
        for (let i = 0; i <= 10; i++) {
          const pos = i * gridStep;

          // Vertical grid lines
          ctx.beginPath();
          ctx.moveTo(pos, 0);
          ctx.lineTo(pos, size);
          ctx.stroke();

          // Horizontal grid lines
          ctx.beginPath();
          ctx.moveTo(0, pos);
          ctx.lineTo(size, pos);
          ctx.stroke();

          // Add coordinate labels to edges
          if (i % 2 === 0) {
            // Mark percentage along edges
            const percent = i * 10;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            // Bottom edge
            ctx.fillText(`${percent}%`, pos, size - 2);
            // Right edge
            ctx.fillText(`${percent}%`, size - 2, pos);
          }
        }

        // Draw stronger lines for the 50% mark (middle of each edge)
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.lineWidth = 2;

        // Vertical middle line
        ctx.beginPath();
        ctx.moveTo(size / 2, 0);
        ctx.lineTo(size / 2, size);
        ctx.stroke();

        // Horizontal middle line
        ctx.beginPath();
        ctx.moveTo(0, size / 2);
        ctx.lineTo(size, size / 2);
        ctx.stroke();

        // Draw tile boundaries
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, size, size);

        // Mark the midpoints of each edge with distinct colors
        // Top edge midpoint (North)
        ctx.fillStyle = 'rgba(0, 0, 255, 0.7)';
        ctx.fillRect(size / 2 - 3, 0, 6, 6);

        // Right edge midpoint (East)
        ctx.fillStyle = 'rgba(255, 165, 0, 0.7)'; // Orange
        ctx.fillRect(size - 6, size / 2 - 3, 6, 6);

        // Bottom edge midpoint (South)
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)'; // Red
        ctx.fillRect(size / 2 - 3, size - 6, 6, 6);

        // Left edge midpoint (West)
        ctx.fillStyle = 'rgba(0, 128, 0, 0.7)'; // Green
        ctx.fillRect(0, size / 2 - 3, 6, 6);

        // Mark the corners clearly
        ctx.fillStyle = 'rgba(128, 0, 128, 0.7)'; // Purple
        ctx.fillRect(0, 0, 6, 6); // Top-left
        ctx.fillRect(size - 6, 0, 6, 6); // Top-right
        ctx.fillRect(0, size - 6, 6, 6); // Bottom-left
        ctx.fillRect(size - 6, size - 6, 6, 6); // Bottom-right
      }

      // Set up drawing parameters
      ctx.lineWidth = size * 0.04; // Width of the center line
      ctx.setLineDash([]); // Solid line for center

      // For square tiles, the arc center must be at the corner
      // For a right curve (north to east), the arc center is at bottom-left (0, size)
      // For a left curve (north to west), the arc center is at bottom-right (size, size)
      const centerX = curveDirection === 'right' ? 0 : size;
      const centerY = size; // Bottom of the canvas

      // For a perfect 90° curve connecting middle of bottom edge to middle of side edge,
      // the radius must be exactly size/2
      const radius = size / 2; // Curve size is calculated here to fit within the tile

      // Calculate the start and end angles for the arc
      const startAngle = -Math.PI / 2; // -90° (middle of bottom edge)
      const endAngle = curveDirection === 'right' ? 0 : -Math.PI; // 0° (right) or -180° (left)

      // Define the exact start and end points to validate arc placement
      const startX = size / 2; // Middle of bottom edge
      const startY = size; // Bottom edge
      const endX = curveDirection === 'right' ? size : 0; // Middle of right or left edge
      const endY = size / 2; // Middle height of canvas

      // Draw curved guiding lines to help visualize the curve path
      if (process.env.NODE_ENV === 'development') {
        // Draw a transparent guide curve directly from start to end
        ctx.strokeStyle = 'rgba(128, 128, 255, 0.1)';
        ctx.lineWidth = size * 0.5; // Much wider than the actual line
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          radius,
          startAngle,
          endAngle,
          curveDirection === 'left'
        );
        ctx.stroke();
      }

      // Draw the yellow center line
      ctx.strokeStyle = '#FFDD00';
      ctx.lineWidth = size * 0.04;
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        radius,
        startAngle,
        endAngle,
        curveDirection === 'left' // clockwise for left curve
      );
      ctx.stroke();

      // Draw the white lane markings
      ctx.strokeStyle = '#FFFFFF';
      ctx.setLineDash([size * 0.1, size * 0.2]); // Dashed line for lane markings
      ctx.lineWidth = size * 0.025;

      // Calculate lane positions at 25% and 75% of the road width
      // Road width is effectively represented by the distance from center to edge, which is size/2
      // So inner lane should be 25% of size/2 from center, outer lane 75% of size/2 from center
      const roadHalfWidth = size / 2;

      // Inner lane marking (closer to center of curve) - positioned at 25% from center
      const innerRadius = radius * 0.5; // 25% of the width from center (50% - 25% = 25% position)
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        innerRadius,
        startAngle,
        endAngle,
        curveDirection === 'left'
      );
      ctx.stroke();

      // Outer lane marking (further from center of curve) - positioned at 75% from center
      const outerRadius = radius * 1.5; // 75% of the width from center (50% + 25% = 75% position)
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        outerRadius,
        startAngle,
        endAngle,
        curveDirection === 'left'
      );
      ctx.stroke();

      // Enhanced debug visualization for curve paths
      if (process.env.NODE_ENV === 'development') {
        // Add highly visible start and end markers for the center line

        // Start point at middle of bottom edge (typically red)
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(startX, startY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();

        // End point at middle of side edge (typically green)
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(endX, endY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label the points
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillText('Start', startX, startY - 10);
        ctx.fillText(
          'End',
          endX + (curveDirection === 'right' ? -20 : 20),
          endY
        );

        // Add visual guides to show the lane positions
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        // Draw circles showing the lane positions
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Label the lane positions
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.setLineDash([]);

        // Display lane position info
        ctx.fillText(`Inner lane: 25%`, size / 2, 60);
        ctx.fillText(`Outer lane: 75%`, size / 2, 75);
      }

      // Restore the canvas state
      ctx.restore();

      break;
    }

    case 'markings-intersection':
      // Draw crosswalk lines
      ctx.fillStyle = '#FFFFFF';

      // Horizontal crosswalk
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(0, size * 0.3 + i * size * 0.1, size, size * 0.05);
      }

      // Stop line
      ctx.fillRect(0, size * 0.2, size, size * 0.06);
      break;

    case 'markings-junction':
      // Draw T-junction markings
      ctx.fillStyle = '#FFFFFF';

      // Main road center line - yellow
      ctx.fillStyle = '#FFDD00';
      ctx.fillRect(0, size * 0.48, size, size * 0.04);

      // Stop line - thick white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(size * 0.3, size * 0.3, size * 0.4, size * 0.06);

      // Yield marks
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(size * 0.4 + i * size * 0.1, size * 0.2);
        ctx.lineTo(size * 0.45 + i * size * 0.1, size * 0.28);
        ctx.lineTo(size * 0.5 + i * size * 0.1, size * 0.2);
        ctx.fill();
      }
      break;
  }

  // Create the texture
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;

  // Important: preserve transparency for road markings
  texture.premultiplyAlpha = true;

  // Set the center of rotation to the middle of the texture
  // This is critical for proper rotation of the texture
  texture.center.set(0.5, 0.5);

  // Apply rotation from options if specified
  if (options?.rotation !== undefined) {
    texture.rotation = options.rotation;
  }

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
    repeat: new Vector2(1, 5),
  },
  curve: {
    roadTexture: 'asphalt.jpg',
    normalMap: 'asphalt_normal.png',
    roughnessMap: 'asphalt_roughness.png',
    repeat: new Vector2(1, 1),
  },
  intersection: {
    roadTexture: 'asphalt.jpg',
    normalMap: 'asphalt_normal.png',
    roughnessMap: 'asphalt_roughness.png',
    repeat: new Vector2(1, 1),
  },
  junction: {
    roadTexture: 'asphalt.jpg',
    normalMap: 'asphalt_normal.png',
    roughnessMap: 'asphalt_roughness.png',
    repeat: new Vector2(1, 1),
  },
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
 * Ensures a texture is properly configured with standard settings
 * This helps prevent inconsistent texture appearances across different surfaces
 * @template T Type of the texture (Texture or CanvasTexture)
 */
const ensureTextureConfig = <T extends Texture>(
  texture: T | null,
  repeat?: Vector2,
  rotation?: number
): T | null => {
  if (!texture) return null;

  // Set essential texture properties
  texture.needsUpdate = true;
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;

  // Apply repeat if provided
  if (repeat) {
    texture.repeat.copy(repeat);
  }

  // Apply rotation if provided
  if (rotation !== undefined) {
    texture.rotation = rotation;
  }

  return texture;
};

/**
 * Hook to generate and prepare textures for a road segment
 * @param segment The road segment to generate textures for
 * @returns Object containing generated textures
 */
export const useRoadTextures = (segment: RoadSegment): RoadTextures => {
  return useMemo(() => {
    // Create default texture options if none are provided
    const defaultOptions: RoadTextureOptions = {
      // Use just the filename - the resolver will handle the path
      roadTexture: 'asphalt.jpg',
      normalMap: 'asphalt_normal.png',
      roughnessMap: 'asphalt_roughness.png',
      repeat: new Vector2(1, segment.type === 'straight' ? 5 : 1),
    };

    // Determine texture options - use segment's options or fall back to defaults
    const textureOptions =
      segment.textureOptions ||
      DEFAULT_TEXTURE_OPTIONS[segment.type] ||
      defaultOptions;

    // Debug: Log segment dimensions
    if (process.env.NODE_ENV === 'development') {
      console.group(`Road Segment Details - ${segment.id} (${segment.type})`);
      console.log('Segment Width:', segment.width);

      // Use type-safe access for segment length calculation
      if (segment.type === 'straight') {
        console.log('Segment Length:', segment.length);
      } else if (segment.type === 'curve') {
        const curveSegment = segment as CurvedRoadSegment;
        console.log(
          'Segment Length:',
          curveSegment.radius * curveSegment.angle
        );
      } else {
        console.log('Segment Length:', segment.length);
      }

      console.log('Segment Height:', segment.position.y);
      console.log('Texture Options:', textureOptions);
      console.groupEnd();
    }

    // Calculate repeat based on segment dimensions - standardized approach for consistent textures
    let repeat = textureOptions.repeat ? textureOptions.repeat.clone() : null;

    // Standardized approach for texture mapping - always use square textures
    if (!repeat) {
      if (segment.type === 'straight') {
        // For straight segments, make textures square by using the width as the base unit
        // This ensures a consistent look between straight and curve segments
        const aspectRatio = segment.width / segment.length;
        repeat = new Vector2(1, 1 / aspectRatio);
      } else if (segment.type === 'curve') {
        // For curved segments, we need to handle the arc length
        // Type-safe access to curve-specific properties
        const curveSegment = segment as CurvedRoadSegment;
        const arcLength = curveSegment.radius * curveSegment.angle;

        // Use a similar aspect ratio approach to ensure consistent square texture mapping
        const aspectRatio = segment.width / arcLength;
        repeat = new Vector2(1, 1 / aspectRatio);

        // Add additional debug logging in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Curve segment ${segment.id} texture mapping:`);
          console.log(`- Width: ${segment.width}, Arc Length: ${arcLength}`);
          console.log(`- Aspect ratio: ${aspectRatio}`);
          console.log(`- Repeat: x=${repeat.x}, y=${repeat.y}`);
        }
      } else {
        // For other segment types (intersections, junctions), use 1:1 mapping
        repeat = new Vector2(1, 1);
      }
    }

    // Ensure the repeat values are always positive and reasonable
    if (repeat) {
      repeat.x = Math.max(0.1, Math.min(10, repeat.x));
      repeat.y = Math.max(0.1, Math.min(10, repeat.y));
    }

    // Create textures based on options
    let asphaltTexture = null;
    let normalMapTexture = null;
    let roughnessTexture = null;
    let markingsTexture: CanvasTexture | null = null;

    // Try to load from file first if path is provided
    if (textureOptions.roadTexture) {
      try {
        console.log(
          'Attempting to load texture from:',
          textureOptions.roadTexture
        );
        asphaltTexture = RoadTextureLoader.loadTexture(
          textureOptions.roadTexture,
          repeat,
          textureOptions.rotation
        );
        console.log('Successfully loaded texture from file');
      } catch (error) {
        console.warn(
          'Failed to load texture from file, falling back to procedural texture',
          error
        );
        asphaltTexture = null;
      }
    }

    // Try to load normal map texture if specified
    if (textureOptions.normalMap) {
      try {
        console.log(
          'Attempting to load normal map from:',
          textureOptions.normalMap
        );
        normalMapTexture = RoadTextureLoader.loadTexture(
          textureOptions.normalMap,
          repeat,
          textureOptions.rotation
        );
        console.log('Successfully loaded normal map');
      } catch (error) {
        console.warn(
          'Failed to load normal map, will continue without it',
          error
        );
        normalMapTexture = null;
      }
    }

    // Try to load roughness map texture if specified
    if (textureOptions.roughnessMap) {
      try {
        console.log(
          'Attempting to load roughness map from:',
          textureOptions.roughnessMap
        );
        roughnessTexture = RoadTextureLoader.loadTexture(
          textureOptions.roughnessMap,
          repeat,
          textureOptions.rotation
        );
        console.log('Successfully loaded roughness map');
      } catch (error) {
        console.warn(
          'Failed to load roughness map, falling back to procedural texture',
          error
        );
        roughnessTexture = null;
      }
    }

    // If file loading failed or no path was provided, create procedural texture
    if (!asphaltTexture) {
      console.log(
        'Creating procedural asphalt texture for segment:',
        segment.id
      );
      asphaltTexture = createCanvasTexture('asphalt', '#333333');
      if (repeat) asphaltTexture.repeat.copy(repeat);
    }

    // If roughness map loading failed, create procedural one
    if (!roughnessTexture) {
      console.log(
        'Creating procedural roughness texture for segment:',
        segment.id
      );
      roughnessTexture = createRoughnessTexture(0.8);
      if (repeat) roughnessTexture.repeat.copy(repeat);
    }

    // Create appropriate markings texture based on segment type
    if (segment.type === 'straight') {
      markingsTexture = createCanvasTexture('markings-straight', '#ffffff');
    } else if (segment.type === 'curve') {
      // Handle curve segment markings
      const curveSegment = segment as RoadSegment & { tileDirection?: string };

      // Get the curve direction based on segment properties
      let curveDirection: 'left' | 'right' = 'right'; // Default to right curve

      // Use the tileDirection property set by SimpleRoadBuilder if available
      if (curveSegment.tileDirection) {
        console.log(`Curve with tileDirection: ${curveSegment.tileDirection}`);

        // Map the curve direction based on tile direction and segment rotation
        // This is critical for properly orienting the curve textures
        const rotDegrees =
          ((((segment.rotation.y * 180) / Math.PI) % 360) + 360) % 360;

        // Normalize rotation to 0-270 degrees (0, 90, 180, 270)
        const normalizedRotation = (Math.round(rotDegrees / 90) * 90) % 360;
        console.log(
          `Curve rotation: ${rotDegrees.toFixed(
            1
          )}° (normalized: ${normalizedRotation}°)`
        );

        // Determine if this is a left or right curve based on the combination of
        // tile direction and rotation
        switch (curveSegment.tileDirection) {
          case 'north':
            curveDirection = 'right';
            break;
          case 'east':
            curveDirection = 'right';
            break;
          case 'south':
            curveDirection = 'right';
            break;
          case 'west':
            curveDirection = 'right';
            break;
          default:
            curveDirection = 'right';
        }

        console.log(`Determined curve direction: ${curveDirection}`);
      }

      // Create the curve markings with the proper direction
      markingsTexture = createCanvasTexture('markings-curve', '#ffffff', 256, {
        rotation: textureOptions.rotation || 0,
        curveDirection: curveDirection,
      });

      // Debug information for curve texture dimensions
      if (process.env.NODE_ENV === 'development') {
        const textureSize = 256; // Canvas size used for marking textures
        const typedCurveSegment = segment as CurvedRoadSegment;
        const curveArcLength =
          typedCurveSegment.radius * typedCurveSegment.angle;

        console.group('Curve Texture Details');
        console.log('Texture Canvas Size:', `${textureSize}x${textureSize}px`);
        console.log('Curve Segment Width:', segment.width);
        console.log('Curve Segment Radius:', typedCurveSegment.radius);
        console.log(
          'Curve Segment Angle:',
          `${typedCurveSegment.angle} rad (${(
            (typedCurveSegment.angle * 180) /
            Math.PI
          ).toFixed(1)}°)`
        );
        console.log('Curve Arc Length:', curveArcLength);
        console.log(
          'Width to Arc Length Ratio:',
          (segment.width / curveArcLength).toFixed(4)
        );

        // Calculate the area of the curve segment (approximately a quarter circle)
        const curveArea =
          (typedCurveSegment.angle / (2 * Math.PI)) *
          Math.PI *
          typedCurveSegment.radius *
          typedCurveSegment.radius;
        console.log('Curve Segment Area (approx):', curveArea.toFixed(2));

        // Calculate texture coverage based on repeat settings
        console.log(
          'Texture Repeat Settings:',
          repeat ? `${repeat.x}x${repeat.y}` : 'default (1x1)'
        );
        console.log(
          'Effective Texture Size:',
          repeat
            ? `${textureSize / repeat.x}x${textureSize / repeat.y}`
            : `${textureSize}x${textureSize}`
        );

        console.log('Rotation:', textureOptions.rotation || 0);
        console.log('Curve Direction:', curveDirection);
        console.groupEnd();
      }

      // Set the center point for texture rotation to ensure markings align correctly
      if (markingsTexture) {
        markingsTexture.center.set(0.5, 0.5);

        // Adjust the repeat settings to ensure the texture spans the entire tile
        markingsTexture.repeat.set(1, 1); // Ensure full coverage of the square tile
      }
    } else if (segment.type === 'intersection') {
      markingsTexture = createCanvasTexture('markings-intersection', '#ffffff');
    } else if (segment.type === 'junction') {
      markingsTexture = createCanvasTexture('markings-junction', '#ffffff');
    }

    if (markingsTexture && repeat) {
      markingsTexture.repeat.copy(repeat);
    }

    // Ensure all textures are properly configured
    asphaltTexture = ensureTextureConfig(
      asphaltTexture,
      repeat,
      textureOptions.rotation
    );
    normalMapTexture = ensureTextureConfig(
      normalMapTexture,
      repeat,
      textureOptions.rotation
    );
    roughnessTexture = ensureTextureConfig(
      roughnessTexture as Texture,
      repeat,
      textureOptions.rotation
    );

    // For markingsTexture, we need to ensure it maintains its CanvasTexture type
    if (markingsTexture) {
      markingsTexture = ensureTextureConfig(
        markingsTexture,
        repeat,
        textureOptions.rotation
      ) as CanvasTexture;
    }

    // CRITICAL: Force texture updates
    // This helps avoid a common React Three Fiber problem where textures don't update properly
    if (asphaltTexture) {
      asphaltTexture.uuid = segment.id + '-asphalt'; // Custom UUID helps debugging
      asphaltTexture.needsUpdate = true;
    }

    if (normalMapTexture) {
      normalMapTexture.uuid = segment.id + '-normal';
      normalMapTexture.needsUpdate = true;
    }

    if (roughnessTexture) {
      roughnessTexture.uuid = segment.id + '-roughness';
      roughnessTexture.needsUpdate = true;
    }

    const result: RoadTextures = {
      map: asphaltTexture,
      normalMap: normalMapTexture,
      roughnessMap: roughnessTexture as CanvasTexture | Texture,
      markingsMap: markingsTexture,
    };

    console.log(
      'Textures created for segment:',
      segment.id,
      !!result.map,
      !!result.normalMap,
      !!result.roughnessMap,
      !!result.markingsMap
    );

    return result;
  }, [segment]);
};
