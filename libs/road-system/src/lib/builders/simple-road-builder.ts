import { Vector3 } from 'three';
import { RoadNetwork, RoadSegment } from '../types/road.types';
import { RoadSegmentFactory } from '../factories/road-segment.factory';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tile types for the simplified road building system
 */
export type RoadTileType =
  | 'straight'
  | 'curve'
  | 'tjunction'
  | 'cross'
  | 'empty';

/**
 * Direction of the tile (rotation around Y axis)
 * - north (0 degrees): default orientation
 * - east (90 degrees): rotated right
 * - south (180 degrees): rotated 180
 * - west (270 degrees): rotated left
 */
export type TileDirection = 'north' | 'east' | 'south' | 'west';

/**
 * Defines a road tile in the layout grid
 */
export type RoadTile = {
  type: RoadTileType;
  direction: TileDirection;
};

/**
 * Simplified road layout using a 2D grid
 */
export type RoadLayout = {
  name: string;
  tileSize: number; // Size of each square tile
  startTile: { x: number; y: number }; // Grid coordinates of the starting tile
  grid: RoadTile[][]; // 2D array of road tiles [row][column]
};

/**
 * SimpleRoadBuilder provides an intuitive way to create road networks
 * using a 2D grid-based approach with a limited set of tile types.
 */
export class SimpleRoadBuilder {
  /**
   * Converts a direction to radians for use in 3D rotations
   */
  private static directionToRadians(direction: TileDirection): number {
    switch (direction) {
      case 'north':
        return 0;
      case 'east':
        return Math.PI / 2;
      case 'south':
        return Math.PI;
      case 'west':
        return Math.PI * 1.5;
    }
  }

  /**
   * Creates a road network from a 2D layout grid
   *
   * @param layout The road layout definition
   * @returns A complete RoadNetwork ready to render
   */
  static createFromLayout(layout: RoadLayout): RoadNetwork {
    const segments: RoadSegment[] = [];

    console.group('Creating road network from layout');
    console.log(
      `Grid size: ${layout.grid.length}x${layout.grid[0]?.length || 0}`
    );
    console.log(`Tile size: ${layout.tileSize}`);

    // Process each cell in the grid
    layout.grid.forEach((row, y) => {
      row.forEach((tile, x) => {
        // Skip empty tiles
        if (tile.type === 'empty') return;

        // Calculate the position in 3D world space
        const position = new Vector3(
          x * layout.tileSize, // X position
          0, // Y is always 0 (flat surface)
          y * layout.tileSize // Z position
        );

        // Calculate Y-axis rotation in radians
        const rotationY = this.directionToRadians(tile.direction);

        console.log(
          `Creating ${tile.type} segment at (${x}, ${y}) => (${position.x}, ${
            position.z
          }) with direction ${tile.direction} (${rotationY.toFixed(2)} radians)`
        );

        // Create the appropriate segment based on tile type
        let segment: RoadSegment | null = null;

        switch (tile.type) {
          case 'straight':
            segment = RoadSegmentFactory.createStraight({
              position,
              rotation: rotationY, // Scalar value for Y-axis rotation
              width: layout.tileSize,
            });
            break;

          case 'curve':
            segment = RoadSegmentFactory.createCurve({
              position,
              rotation: rotationY, // Scalar value for Y-axis rotation
              width: layout.tileSize,
            });

            // Store the original tile direction for proper texture orientation
            (segment as any).tileDirection = tile.direction;
            break;

          case 'tjunction':
            segment = RoadSegmentFactory.createTJunction({
              position,
              rotation: rotationY, // Scalar value for Y-axis rotation
              width: layout.tileSize,
            });
            break;

          case 'cross':
            segment = RoadSegmentFactory.createIntersection({
              position,
              rotation: rotationY, // Scalar value for Y-axis rotation
              width: layout.tileSize,
            });
            break;
        }

        if (segment) {
          const segmentIndex = segments.length;

          // Log the segment details before ensuring it's flat
          console.log(`Segment ${segmentIndex} created:`, {
            type: segment.type,
            position: `(${segment.position.x.toFixed(
              2
            )}, ${segment.position.y.toFixed(2)}, ${segment.position.z.toFixed(
              2
            )})`,
            rotation: `(${segment.rotation.x.toFixed(
              2
            )}, ${segment.rotation.y.toFixed(2)}, ${segment.rotation.z.toFixed(
              2
            )})`,
          });

          // Ensure segments stay perfectly flat on the XZ plane
          segment.position.y = 0;
          segment.rotation.x = 0;
          segment.rotation.z = 0;

          // Log the segment details after ensuring it's flat
          console.log(`Segment ${segmentIndex} flattened:`, {
            position: `(${segment.position.x.toFixed(
              2
            )}, ${segment.position.y.toFixed(2)}, ${segment.position.z.toFixed(
              2
            )})`,
            rotation: `(${segment.rotation.x.toFixed(
              2
            )}, ${segment.rotation.y.toFixed(2)}, ${segment.rotation.z.toFixed(
              2
            )})`,
          });

          // Log all connection points
          console.group(`Segment ${segmentIndex} connections:`);
          Object.entries(segment.connections).forEach(([key, connection]) => {
            if (connection) {
              // Before enforcing y=0
              console.log(`Connection "${key}":`, {
                position: `(${connection.position.x.toFixed(
                  2
                )}, ${connection.position.y.toFixed(
                  2
                )}, ${connection.position.z.toFixed(2)})`,
                direction: `(${connection.direction.x.toFixed(
                  2
                )}, ${connection.direction.y.toFixed(2)})`,
              });

              // Ensure connection points stay flat
              connection.position.y = 0;

              // After enforcing y=0
              console.log(`Connection "${key}" (flattened):`, {
                position: `(${connection.position.x.toFixed(
                  2
                )}, ${connection.position.y.toFixed(
                  2
                )}, ${connection.position.z.toFixed(2)})`,
              });
            }
          });
          console.groupEnd();

          segments.push(segment);
        }
      });
    });

    // Calculate the starting point
    const startX = layout.startTile.x * layout.tileSize;
    const startZ = layout.startTile.y * layout.tileSize;
    const startPoint = new Vector3(startX, 0, startZ);

    // Create simple checkpoints at every other intersection
    const checkpoints: Vector3[] = [];

    console.log('Road network creation complete');
    console.log(`Total segments: ${segments.length}`);
    console.groupEnd();

    return {
      id: uuidv4(),
      name: layout.name,
      segments,
      startPoint,
      checkpoints,
    };
  }

  /**
   * Creates a simple test track with a few road segments
   *
   * @param tileSize The size of each road tile
   * @returns A small test road network
   */
  static createTestTrack(tileSize = 7): RoadNetwork {
    const layout: RoadLayout = {
      name: 'Simple Test Track',
      tileSize,
      startTile: { x: 0, y: 0 },
      // Create a simple L-shaped track without any problematic rotations
      grid: [
        [
          { type: 'straight', direction: 'east' }, // First segment going east
          { type: 'straight', direction: 'east' }, // Second segment going east
          { type: 'curve', direction: 'south' }, // Curve turning from east to south
        ],
        [
          { type: 'empty', direction: 'north' },
          { type: 'empty', direction: 'north' },
          { type: 'straight', direction: 'south' }, // Straight going south
        ],
        [
          { type: 'empty', direction: 'north' },
          { type: 'empty', direction: 'north' },
          { type: 'straight', direction: 'south' }, // Straight going south
        ],
      ],
    };

    return this.createFromLayout(layout);
  }

  /**
   * Creates a simple grid city layout with intersections
   *
   * @param size The number of blocks in each direction (minimum 2)
   * @param tileSize The size of each road tile
   * @returns A grid city road network
   */
  static createGridCity(size = 3, tileSize = 7): RoadNetwork {
    size = Math.max(2, size); // Minimum size of 2

    // Create a grid with (size*2-1) x (size*2-1) dimension
    // where every other tile is an intersection
    const gridSize = size * 2 - 1;
    const grid: RoadTile[][] = [];

    for (let y = 0; y < gridSize; y++) {
      const row: RoadTile[] = [];
      for (let x = 0; x < gridSize; x++) {
        const isEvenX = x % 2 === 0;
        const isEvenY = y % 2 === 0;

        if (isEvenX && isEvenY) {
          // Intersections at even-even coordinates
          row.push({ type: 'cross', direction: 'north' });
        } else if (isEvenX) {
          // Vertical streets
          row.push({ type: 'straight', direction: 'north' });
        } else if (isEvenY) {
          // Horizontal streets
          row.push({ type: 'straight', direction: 'east' });
        } else {
          // Empty blocks
          row.push({ type: 'empty', direction: 'north' });
        }
      }
      grid.push(row);
    }

    const layout: RoadLayout = {
      name: 'Grid City',
      tileSize,
      startTile: { x: 0, y: 0 },
      grid,
    };

    return this.createFromLayout(layout);
  }

  /**
   * Creates a simple square track
   *
   * @param size The size of the square in tiles
   * @param tileSize The size of each road tile
   * @returns A square track road network
   */
  static createSquareTrack(size = 5, tileSize = 7): RoadNetwork {
    size = Math.max(4, size); // Minimum size of 4 to create a proper square

    // Create a square track with a hollow center
    const grid: RoadTile[][] = [];

    for (let y = 0; y < size; y++) {
      const row: RoadTile[] = [];
      for (let x = 0; x < size; x++) {
        if (y === 0 && x === 0) {
          // Top-left corner
          row.push({ type: 'curve', direction: 'north' });
        } else if (y === 0 && x === size - 1) {
          // Top-right corner
          row.push({ type: 'curve', direction: 'east' });
        } else if (y === size - 1 && x === 0) {
          // Bottom-left corner
          row.push({ type: 'curve', direction: 'west' });
        } else if (y === size - 1 && x === size - 1) {
          // Bottom-right corner
          row.push({ type: 'curve', direction: 'south' });
        } else if (y === 0 || y === size - 1) {
          // Top and bottom edges
          row.push({ type: 'straight', direction: 'east' });
        } else if (x === 0 || x === size - 1) {
          // Left and right edges
          row.push({ type: 'straight', direction: 'north' });
        } else {
          // Empty center
          row.push({ type: 'empty', direction: 'north' });
        }
      }
      grid.push(row);
    }

    const layout: RoadLayout = {
      name: 'Square Track',
      tileSize,
      startTile: { x: 1, y: 0 }, // Start on the top edge
      grid,
    };

    return this.createFromLayout(layout);
  }
}
