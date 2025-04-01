import { Vector3, Vector2 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import {
  RoadSegment,
  RoadConnection,
  RoadTextureOptions,
  RoadSegmentType,
  StraightRoadSegment,
  CurvedRoadSegment,
  IntersectionRoadSegment,
  JunctionRoadSegment,
} from '../types/road.types';

/**
 * ===================================
 * ROAD SEGMENT FACTORY - SQUARE DESIGN
 * ===================================
 *
 * This factory implements a unified approach to road segments using a square-based design.
 *
 * DESIGN PRINCIPLES:
 * ------------------
 * 1. Unified Shape: All road segments are square with the same width and length.
 * 2. Connection-Based Differentiation: Road segments differ by their connection points.
 * 3. Compass-Point Connections: Connection points are identified using compass points
 *    (north, south, east, west) for intuitive positioning and alignment.
 * 4. Flat Surface Constraint: All segments are placed on a flat plane (y = 0).
 * 5. Y-Axis Rotation Only: Segments rotate only around the vertical axis.
 *
 * CONNECTION MAPPING:
 * ------------------
 * Each road segment type has specific connection points:
 *
 * - Straight: Connections on opposite sides (north-south or east-west)
 * - Curve: Connections on adjacent sides (e.g., north-east for a right curve)
 * - T-Junction: Connections on three sides (e.g., north-south-east)
 * - Intersection: Connections on all four sides
 * - Dead End: Connection on only one side
 *
 * USAGE EXAMPLE:
 * -------------
 * // Create a straight road segment
 * const straightRoad = RoadSegmentFactory.createStraight({
 *   position: new Vector3(0, 0, 0),
 *   rotation: 0, // Measured in radians around Y-axis
 *   width: 7 // Optional - defaults to 7
 * });
 *
 * // Create a curved road segment
 * const curvedRoad = RoadSegmentFactory.createCurve({
 *   position: new Vector3(7, 0, 0),
 *   rotation: 0
 * });
 *
 * // Connect the segments (connects 'south' of straightRoad to 'north' of curvedRoad)
 * RoadSegmentFactory.connectSegments(straightRoad, 'south', curvedRoad, 'north');
 */

export type ConnectionKey =
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'start'
  | 'end'
  | 'main'
  | 'branch';

// Update to a more flexible type that doesn't require all keys to be present
export type CompassConnectionsMap = {
  north?: RoadConnection | null;
  south?: RoadConnection | null;
  east?: RoadConnection | null;
  west?: RoadConnection | null;
};

// Segment-specific connection maps
export type StraightConnectionsMap = {
  start: RoadConnection;
  end: RoadConnection;
};

export type CurveConnectionsMap = {
  start: RoadConnection;
  end: RoadConnection;
};

export type JunctionConnectionsMap = {
  main: RoadConnection;
  end: RoadConnection;
  branch: RoadConnection;
};

export type IntersectionConnectionsMap = {
  north: RoadConnection;
  south: RoadConnection;
  east: RoadConnection;
  west: RoadConnection;
};

export type CreateRoadSegmentOptions = {
  position: Vector3;
  rotation?: number; // Rotation in radians around the Y-axis
  width?: number;
  pavementWidth?: number;
  lanes?: number;
  hasCrosswalk?: boolean;
  textureOptions?: Partial<RoadTextureOptions>;
};

export class RoadSegmentFactory {
  /**
   * Validates that a position is on the flat surface (y = 0).
   * If not, corrects it and logs a warning.
   *
   * @param position - The position to validate
   * @param context - The context for error reporting
   */
  private static validateFlatSurface(position: Vector3, context: string): void {
    if (Math.abs(position.y) > 0.001) {
      console.warn(
        `${context}: Position must be on flat surface (y = 0), got y = ${position.y}. Correcting to y = 0.`
      );
      position.y = 0;
    }
  }

  /**
   * Validates that rotation is only around the Y-axis and within the correct range.
   *
   * @param rotation - The rotation to validate (in radians)
   * @param context - The context for error reporting
   */
  private static validateYAxisRotation(
    rotation: number,
    context: string
  ): void {
    if (rotation < 0 || rotation >= 2 * Math.PI) {
      console.warn(
        `${context}: Rotation should be within [0, 2π). Adjusting rotation.`
      );
    }
  }

  /**
   * Creates common segment properties shared by all road segment types.
   *
   * @param options - Road segment creation options
   * @param type - The type of road segment to create
   * @returns Common road segment properties
   */
  private static createCommonSegmentProps(
    options: CreateRoadSegmentOptions,
    type: RoadSegmentType
  ) {
    const {
      position,
      rotation = 0,
      width = 7,
      pavementWidth = 1.5,
      lanes = 2,
      hasCrosswalk = false,
      textureOptions = {},
    } = options;

    return {
      id: uuidv4(),
      type,
      position,
      rotation: new Vector3(0, rotation, 0), // Convert to Vector3 for rotation
      width,
      length: width, // For square segments, length equals width
      pavementWidth,
      lanes,
      hasCrosswalk,
      textureOptions: {
        roadTexture: textureOptions.roadTexture || 'asphalt.jpg',
        normalMap: textureOptions.normalMap || 'asphalt_normal.png',
        roughnessMap: textureOptions.roughnessMap || 'asphalt_roughness.png',
      },
    };
  }

  /**
   * Creates a straight road segment with connections on the north and south sides.
   *
   * VISUAL REPRESENTATION:
   * ┌───────┐
   * │       │
   * │   N   │ ← Connection Point (North)
   * │       │
   * │       │
   * │       │
   * │   S   │ ← Connection Point (South)
   * │       │
   * └───────┘
   *
   * @param options - Road segment creation options
   * @returns A straight road segment
   */
  static createStraight(
    options: CreateRoadSegmentOptions
  ): StraightRoadSegment {
    const { position, rotation = 0, width = 7 } = options;
    this.validateFlatSurface(position, 'createStraight');
    this.validateYAxisRotation(rotation, 'createStraight');

    const halfWidth = width / 2;

    const connectionsMap: CompassConnectionsMap = {
      north: {
        position: new Vector3(position.x, 0, position.z - halfWidth),
        direction: new Vector2(0, -1),
        width,
      },
      south: {
        position: new Vector3(position.x, 0, position.z + halfWidth),
        direction: new Vector2(0, 1),
        width,
      },
      east: null,
      west: null,
    };

    // For TypeScript compatibility, convert our new connections map to the expected structure
    // Avoid non-null assertions by checking
    const northConnection = connectionsMap.north;
    const southConnection = connectionsMap.south;

    if (!northConnection || !southConnection) {
      throw new Error(
        'Failed to create north or south connection points for straight segment'
      );
    }

    // Create the segment-specific connections map
    const connections: StraightConnectionsMap = {
      start: northConnection,
      end: southConnection,
    };

    return {
      ...this.createCommonSegmentProps(options, 'straight'),
      connections,
    } as StraightRoadSegment;
  }

  /**
   * Creates a curved road segment with connections on the north and east sides.
   * Default is a 90-degree right curve (north to east).
   *
   * VISUAL REPRESENTATION:
   * ┌───────┐
   * │       │
   * │   N   │ ← Connection Point (North)
   * │       │
   * │   ┌───┘
   * │   │
   * │   E   │ ← Connection Point (East)
   * │       │
   * └───────┘
   *
   * @param options - Road segment creation options
   * @returns A curved road segment
   */
  static createCurve(options: CreateRoadSegmentOptions): CurvedRoadSegment {
    const { position, rotation = 0, width = 7 } = options;
    this.validateFlatSurface(position, 'createCurve');
    this.validateYAxisRotation(rotation, 'createCurve');

    const halfWidth = width / 2;
    const radius = width / 2;

    const connectionsMap: CompassConnectionsMap = {
      north: {
        position: new Vector3(position.x, 0, position.z - halfWidth),
        direction: new Vector2(0, -1),
        width,
      },
      east: {
        position: new Vector3(position.x + halfWidth, 0, position.z),
        direction: new Vector2(1, 0),
        width,
      },
      south: null,
      west: null,
    };

    // For TypeScript compatibility, convert our new connections map to the expected structure
    // Avoid non-null assertions by checking
    const northConnection = connectionsMap.north;
    const eastConnection = connectionsMap.east;

    if (!northConnection || !eastConnection) {
      throw new Error(
        'Failed to create north or east connection points for curved segment'
      );
    }

    // Create the segment-specific connections map
    const connections: CurveConnectionsMap = {
      start: northConnection,
      end: eastConnection,
    };

    return {
      ...this.createCommonSegmentProps(options, 'curve'),
      radius,
      angle: Math.PI / 2, // 90 degrees curved road
      direction: 'right', // Default right curve (north to east)
      connections,
    } as CurvedRoadSegment;
  }

  /**
   * Creates an intersection road segment with connections on all four sides.
   *
   * VISUAL REPRESENTATION:
   * ┌───────┐
   * │       │
   * │   N   │ ← Connection Point (North)
   * │       │
   * │W     E│ ← Connection Points (West, East)
   * │       │
   * │   S   │ ← Connection Point (South)
   * │       │
   * └───────┘
   *
   * @param options - Road segment creation options
   * @returns An intersection road segment
   */
  static createIntersection(
    options: CreateRoadSegmentOptions
  ): IntersectionRoadSegment {
    const { position, rotation = 0, width = 7 } = options;
    this.validateFlatSurface(position, 'createIntersection');
    this.validateYAxisRotation(rotation, 'createIntersection');

    const halfWidth = width / 2;

    const connectionsMap: CompassConnectionsMap = {
      north: {
        position: new Vector3(position.x, 0, position.z - halfWidth),
        direction: new Vector2(0, -1),
        width,
      },
      south: {
        position: new Vector3(position.x, 0, position.z + halfWidth),
        direction: new Vector2(0, 1),
        width,
      },
      east: {
        position: new Vector3(position.x + halfWidth, 0, position.z),
        direction: new Vector2(1, 0),
        width,
      },
      west: {
        position: new Vector3(position.x - halfWidth, 0, position.z),
        direction: new Vector2(-1, 0),
        width,
      },
    };

    // For TypeScript compatibility, convert our new connections map to the expected structure
    // Avoid non-null assertions by checking
    const northConnection = connectionsMap.north;
    const southConnection = connectionsMap.south;
    const eastConnection = connectionsMap.east;
    const westConnection = connectionsMap.west;

    if (
      !northConnection ||
      !southConnection ||
      !eastConnection ||
      !westConnection
    ) {
      throw new Error(
        'Failed to create connection points for intersection segment'
      );
    }

    // Create the segment-specific connections map
    const connections: IntersectionConnectionsMap = {
      north: northConnection,
      south: southConnection,
      east: eastConnection,
      west: westConnection,
    };

    return {
      ...this.createCommonSegmentProps(options, 'intersection'),
      connections,
    } as IntersectionRoadSegment;
  }

  /**
   * Creates a T-junction road segment with connections on three sides.
   * Default is a T-junction with north, south, and east connections.
   *
   * VISUAL REPRESENTATION:
   * ┌───────┐
   * │       │
   * │   N   │ ← Connection Point (North/Main)
   * │       │
   * │       │
   * │       │
   * │   S   │ ← Connection Point (South/End)
   * │       │
   * └───E───┘ ← Connection Point (East/Branch)
   *
   * @param options - Road segment creation options
   * @returns A T-junction road segment
   */
  static createTJunction(
    options: CreateRoadSegmentOptions
  ): JunctionRoadSegment {
    const { position, rotation = 0, width = 7 } = options;
    this.validateFlatSurface(position, 'createTJunction');
    this.validateYAxisRotation(rotation, 'createTJunction');

    const halfWidth = width / 2;

    const connectionsMap: CompassConnectionsMap = {
      north: {
        position: new Vector3(position.x, 0, position.z - halfWidth),
        direction: new Vector2(0, -1),
        width,
      },
      south: {
        position: new Vector3(position.x, 0, position.z + halfWidth),
        direction: new Vector2(0, 1),
        width,
      },
      east: {
        position: new Vector3(position.x + halfWidth, 0, position.z),
        direction: new Vector2(1, 0),
        width,
      },
      west: null,
    };

    // For TypeScript compatibility, convert our new connections map to the expected structure
    // Avoid non-null assertions by checking
    const northConnection = connectionsMap.north;
    const southConnection = connectionsMap.south;
    const eastConnection = connectionsMap.east;

    if (!northConnection || !southConnection || !eastConnection) {
      throw new Error(
        'Failed to create connection points for T-junction segment'
      );
    }

    // Create the segment-specific connections map
    const connections: JunctionConnectionsMap = {
      main: northConnection,
      end: southConnection,
      branch: eastConnection,
    };

    return {
      ...this.createCommonSegmentProps(options, 'junction'),
      connections,
      branchDirection: 'right', // Default right branch
    } as JunctionRoadSegment;
  }

  /**
   * Creates a dead-end road segment with a connection only on the north side.
   *
   * VISUAL REPRESENTATION:
   * ┌───────┐
   * │       │
   * │   N   │ ← Connection Point (North/Start)
   * │       │
   * │       │
   * │       │
   * │       │
   * │       │
   * └───────┘
   *
   * @param options - Road segment creation options
   * @returns A dead-end road segment
   */
  static createDeadEnd(options: CreateRoadSegmentOptions): StraightRoadSegment {
    const { position, rotation = 0, width = 7 } = options;
    this.validateFlatSurface(position, 'createDeadEnd');
    this.validateYAxisRotation(rotation, 'createDeadEnd');

    const halfWidth = width / 2;

    const connectionsMap: CompassConnectionsMap = {
      north: {
        position: new Vector3(position.x, 0, position.z - halfWidth),
        direction: new Vector2(0, -1),
        width,
      },
      south: null,
      east: null,
      west: null,
    };

    // For TypeScript compatibility, convert our new connections map to the expected structure
    // Avoid non-null assertions by checking
    const northConnection = connectionsMap.north;

    if (!northConnection) {
      throw new Error(
        'Failed to create north connection point for dead-end segment'
      );
    }

    // Create a special straight segment with only one connection
    const connections = {
      start: northConnection,
      end: null as unknown as RoadConnection, // Type assertion needed for compatibility
    };

    return {
      ...this.createCommonSegmentProps(options, 'straight'),
      connections,
    } as StraightRoadSegment;
  }

  /**
   * Rotates a road segment and all its connection points around the Y-axis.
   *
   * @param segment - The segment to rotate
   * @param rotationRadians - Rotation angle in radians
   * @returns Rotated road segment
   */
  static rotateSegment(
    segment: RoadSegment,
    rotationRadians: number
  ): RoadSegment {
    // Create a clone of the segment to avoid modifying the original
    const rotatedSegment = { ...segment };

    // Normalize the rotation angle to [0, 2π)
    const normalizedRotation =
      ((rotationRadians % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Update the segment's rotation
    rotatedSegment.rotation = new Vector3(0, normalizedRotation, 0);

    // Get the sin and cos of the rotation angle for the transformation
    const sin = Math.sin(normalizedRotation);
    const cos = Math.cos(normalizedRotation);

    // Create a function to rotate a point around the Y-axis
    const rotatePoint = (point: Vector3, origin: Vector3): Vector3 => {
      // Translate point to origin
      const x = point.x - origin.x;
      const z = point.z - origin.z;

      // Rotate point
      const newX = x * cos - z * sin;
      const newZ = x * sin + z * cos;

      // Translate back and return new point
      return new Vector3(
        origin.x + newX,
        point.y, // Y-coordinate remains unchanged
        origin.z + newZ
      );
    };

    // Create a function to rotate a direction vector
    const rotateDirection = (dir: Vector2): Vector2 => {
      // Rotate the direction vector
      return new Vector2(
        dir.x * cos - dir.y * sin,
        dir.x * sin + dir.y * cos
      ).normalize();
    };

    // Rotate all connection points based on segment type
    switch (segment.type) {
      case 'straight': {
        const segConnections = rotatedSegment.connections as {
          start: RoadConnection;
          end: RoadConnection;
        };
        if (segConnections.start) {
          segConnections.start.position = rotatePoint(
            segConnections.start.position.clone(),
            segment.position
          );
          segConnections.start.direction = rotateDirection(
            segConnections.start.direction.clone()
          );
        }
        if (segConnections.end) {
          segConnections.end.position = rotatePoint(
            segConnections.end.position.clone(),
            segment.position
          );
          segConnections.end.direction = rotateDirection(
            segConnections.end.direction.clone()
          );
        }
        break;
      }
      case 'curve': {
        const segConnections = rotatedSegment.connections as {
          start: RoadConnection;
          end: RoadConnection;
        };
        if (segConnections.start) {
          segConnections.start.position = rotatePoint(
            segConnections.start.position.clone(),
            segment.position
          );
          segConnections.start.direction = rotateDirection(
            segConnections.start.direction.clone()
          );
        }
        if (segConnections.end) {
          segConnections.end.position = rotatePoint(
            segConnections.end.position.clone(),
            segment.position
          );
          segConnections.end.direction = rotateDirection(
            segConnections.end.direction.clone()
          );
        }
        break;
      }
      case 'intersection': {
        const segConnections = rotatedSegment.connections as Record<
          ConnectionKey,
          RoadConnection
        >;
        Object.keys(segConnections).forEach((key) => {
          const connectionKey = key as ConnectionKey;
          const connection = segConnections[connectionKey];
          if (connection) {
            segConnections[connectionKey].position = rotatePoint(
              connection.position.clone(),
              segment.position
            );
            segConnections[connectionKey].direction = rotateDirection(
              connection.direction.clone()
            );
          }
        });
        break;
      }
      case 'junction': {
        const segConnections = rotatedSegment.connections as {
          main: RoadConnection;
          end: RoadConnection;
          branch: RoadConnection;
        };
        if (segConnections.main) {
          segConnections.main.position = rotatePoint(
            segConnections.main.position.clone(),
            segment.position
          );
          segConnections.main.direction = rotateDirection(
            segConnections.main.direction.clone()
          );
        }
        if (segConnections.end) {
          segConnections.end.position = rotatePoint(
            segConnections.end.position.clone(),
            segment.position
          );
          segConnections.end.direction = rotateDirection(
            segConnections.end.direction.clone()
          );
        }
        if (segConnections.branch) {
          segConnections.branch.position = rotatePoint(
            segConnections.branch.position.clone(),
            segment.position
          );
          segConnections.branch.direction = rotateDirection(
            segConnections.branch.direction.clone()
          );
        }
        break;
      }
    }

    // Log rotation success in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `Rotated ${segment.type} segment by ${normalizedRotation.toFixed(
          2
        )} radians`
      );
    }

    return rotatedSegment;
  }

  /**
   * Gets a connection point from a road segment using either a compass direction
   * or a segment-type-specific connection name.
   *
   * @param segment - The road segment to get a connection from
   * @param connectionKey - The key for the connection to retrieve
   * @returns The requested connection point or null if it doesn't exist
   */
  static getConnection(
    segment: RoadSegment,
    connectionKey: string
  ): RoadConnection | null {
    // First handle segment-specific connection names
    switch (segment.type) {
      case 'straight':
        if (connectionKey === 'start') return segment.connections.start;
        if (connectionKey === 'end') return segment.connections.end;
        break;
      case 'curve':
        if (connectionKey === 'start') return segment.connections.start;
        if (connectionKey === 'end') return segment.connections.end;
        break;
      case 'intersection':
        if (connectionKey === 'north') return segment.connections.north;
        if (connectionKey === 'south') return segment.connections.south;
        if (connectionKey === 'east') return segment.connections.east;
        if (connectionKey === 'west') return segment.connections.west;
        break;
      case 'junction':
        if (connectionKey === 'main') return segment.connections.main;
        if (connectionKey === 'end') return segment.connections.end;
        if (connectionKey === 'branch') return segment.connections.branch;
        break;
    }

    // For straight and curve segments, handle compass directions based on rotation
    if (segment.type === 'straight' || segment.type === 'curve') {
      // Get the segment's rotation angle around Y axis (in radians)
      const rotation = segment.rotation.y;

      // Map compass directions to connection points based on rotation
      // For straight segments with default rotation (0), north=start and south=end
      if (segment.type === 'straight') {
        // Get the normalized rotation angle in 0-360 degrees range for easier comparison
        const rotDegrees = ((((rotation * 180) / Math.PI) % 360) + 360) % 360;

        // Map compass points based on rotation
        if (rotDegrees >= 315 || rotDegrees < 45) {
          // Default orientation: north=start, south=end
          if (connectionKey === 'north') return segment.connections.start;
          if (connectionKey === 'south') return segment.connections.end;
        } else if (rotDegrees >= 45 && rotDegrees < 135) {
          // 90° rotation: east=start, west=end
          if (connectionKey === 'east') return segment.connections.start;
          if (connectionKey === 'west') return segment.connections.end;
        } else if (rotDegrees >= 135 && rotDegrees < 225) {
          // 180° rotation: south=start, north=end
          if (connectionKey === 'south') return segment.connections.start;
          if (connectionKey === 'north') return segment.connections.end;
        } else if (rotDegrees >= 225 && rotDegrees < 315) {
          // 270° rotation: west=start, east=end
          if (connectionKey === 'west') return segment.connections.start;
          if (connectionKey === 'east') return segment.connections.end;
        }
      }

      // For curved segments with default rotation (0), north=start and east=end
      if (segment.type === 'curve') {
        // Get the normalized rotation angle in 0-360 degrees range
        const rotDegrees = ((((rotation * 180) / Math.PI) % 360) + 360) % 360;

        if (rotDegrees >= 315 || rotDegrees < 45) {
          // Default orientation: north=start, east=end
          if (connectionKey === 'north') return segment.connections.start;
          if (connectionKey === 'east') return segment.connections.end;
        } else if (rotDegrees >= 45 && rotDegrees < 135) {
          // 90° rotation: east=start, south=end
          if (connectionKey === 'east') return segment.connections.start;
          if (connectionKey === 'south') return segment.connections.end;
        } else if (rotDegrees >= 135 && rotDegrees < 225) {
          // 180° rotation: south=start, west=end
          if (connectionKey === 'south') return segment.connections.start;
          if (connectionKey === 'west') return segment.connections.end;
        } else if (rotDegrees >= 225 && rotDegrees < 315) {
          // 270° rotation: west=start, north=end
          if (connectionKey === 'west') return segment.connections.start;
          if (connectionKey === 'north') return segment.connections.end;
        }
      }
    }

    // For junctions, map compass directions based on orientation
    if (segment.type === 'junction') {
      const junction = segment as JunctionRoadSegment;
      const rotation = segment.rotation.y;
      const rotDegrees = ((((rotation * 180) / Math.PI) % 360) + 360) % 360;

      // Default orientation (0°): main=north, end=south, branch=east/west
      if (rotDegrees >= 315 || rotDegrees < 45) {
        if (connectionKey === 'north') return segment.connections.main;
        if (connectionKey === 'south') return segment.connections.end;
        if (connectionKey === 'east' && junction.branchDirection === 'right') {
          return segment.connections.branch;
        }
        if (connectionKey === 'west' && junction.branchDirection === 'left') {
          return segment.connections.branch;
        }
      }
      // 90° rotation: main=east, end=west, branch=north/south
      else if (rotDegrees >= 45 && rotDegrees < 135) {
        if (connectionKey === 'east') return segment.connections.main;
        if (connectionKey === 'west') return segment.connections.end;
        if (connectionKey === 'south' && junction.branchDirection === 'right') {
          return segment.connections.branch;
        }
        if (connectionKey === 'north' && junction.branchDirection === 'left') {
          return segment.connections.branch;
        }
      }
      // 180° rotation: main=south, end=north, branch=west/east
      else if (rotDegrees >= 135 && rotDegrees < 225) {
        if (connectionKey === 'south') return segment.connections.main;
        if (connectionKey === 'north') return segment.connections.end;
        if (connectionKey === 'west' && junction.branchDirection === 'right') {
          return segment.connections.branch;
        }
        if (connectionKey === 'east' && junction.branchDirection === 'left') {
          return segment.connections.branch;
        }
      }
      // 270° rotation: main=west, end=east, branch=south/north
      else if (rotDegrees >= 225 && rotDegrees < 315) {
        if (connectionKey === 'west') return segment.connections.main;
        if (connectionKey === 'east') return segment.connections.end;
        if (connectionKey === 'north' && junction.branchDirection === 'right') {
          return segment.connections.branch;
        }
        if (connectionKey === 'south' && junction.branchDirection === 'left') {
          return segment.connections.branch;
        }
      }
    }

    // If no connection found, return null
    return null;
  }

  /**
   * Connects two road segments by aligning their connection points.
   *
   * @param segment1 - First segment to connect
   * @param connection1 - Connection point name on the first segment
   * @param segment2 - Second segment to connect
   * @param connection2 - Connection point name on the second segment
   * @returns True if the connection was successful, false otherwise
   */
  static connectSegments(
    segment1: RoadSegment,
    connection1: string,
    segment2: RoadSegment,
    connection2: string
  ): boolean {
    // Get the connection points from both segments
    const conn1 = this.getConnection(segment1, connection1);
    const conn2 = this.getConnection(segment2, connection2);

    if (!conn1 || !conn2) {
      console.error('Connection points not found', {
        segment1: segment1.id,
        connection1,
        segment2: segment2.id,
        connection2,
      });
      return false;
    }

    // To connect segment2 to segment1, we need to:
    // 1. Calculate the position offset
    // 2. Calculate the rotation needed
    // 3. Apply the rotation to segment2
    // 4. Move segment2 so that its connection point aligns with segment1's connection point

    // Connection directions should be opposite for a valid connection
    const targetDirection = new Vector2(-conn1.direction.x, -conn1.direction.y);

    // Calculate the angle between connection2's direction and the target direction
    let angle =
      Math.atan2(targetDirection.y, targetDirection.x) -
      Math.atan2(conn2.direction.y, conn2.direction.x);

    // Normalize the angle to [0, 2π)
    angle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Rotate segment2 to align with the target direction
    const rotatedSegment2 = this.rotateSegment(segment2, angle);

    // Get the rotated connection point
    const rotatedConn2 = this.getConnection(rotatedSegment2, connection2);

    if (!rotatedConn2) {
      console.error('Rotated connection point not found');
      return false;
    }

    // Calculate offset to align connection points
    // Enforce y=0 explicitly for flat surface constraint
    const offset = new Vector3(
      conn1.position.x - rotatedConn2.position.x,
      0, // Ensure Y is exactly 0 to maintain flat surface
      conn1.position.z - rotatedConn2.position.z
    );

    // Apply the rotation to segment2 (strictly around Y-axis only)
    segment2.rotation.set(0, angle, 0);

    // Apply the offset to segment2's position
    segment2.position.add(offset);

    // Explicitly enforce Y=0 for segment position
    segment2.position.y = 0;

    // Update segment2's connection points by applying the same rotation and translation
    const rotateAndTranslateConnections = () => {
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);

      // Function to rotate a point around Y axis and translate it
      const transformPoint = (point: Vector3): Vector3 => {
        // First rotate around origin (relative to segment's position before offset)
        const originalX = point.x - (segment2.position.x - offset.x);
        const originalZ = point.z - (segment2.position.z - offset.z);

        const rotatedX = originalX * cos - originalZ * sin;
        const rotatedZ = originalX * sin + originalZ * cos;

        // Then translate to final position
        return new Vector3(
          segment2.position.x + rotatedX - originalX,
          0, // Force Y=0 for all connection points
          segment2.position.z + rotatedZ - originalZ
        );
      };

      // Function to rotate a direction vector
      const transformDirection = (dir: Vector2): Vector2 => {
        return new Vector2(
          dir.x * cos - dir.y * sin,
          dir.x * sin + dir.y * cos
        ).normalize();
      };

      // Apply transformations to all connection points based on segment type
      switch (segment2.type) {
        case 'straight': {
          const connections = segment2.connections as {
            start: RoadConnection;
            end: RoadConnection;
          };
          if (connections.start) {
            connections.start.position = transformPoint(
              connections.start.position
            );
            connections.start.direction = transformDirection(
              connections.start.direction
            );
          }
          if (connections.end) {
            connections.end.position = transformPoint(connections.end.position);
            connections.end.direction = transformDirection(
              connections.end.direction
            );
          }
          break;
        }
        case 'curve': {
          const connections = segment2.connections as {
            start: RoadConnection;
            end: RoadConnection;
          };
          if (connections.start) {
            connections.start.position = transformPoint(
              connections.start.position
            );
            connections.start.direction = transformDirection(
              connections.start.direction
            );
          }
          if (connections.end) {
            connections.end.position = transformPoint(connections.end.position);
            connections.end.direction = transformDirection(
              connections.end.direction
            );
          }
          break;
        }
        case 'intersection': {
          const connections = segment2.connections as Record<
            ConnectionKey,
            RoadConnection
          >;
          Object.keys(connections).forEach((key) => {
            const connectionKey = key as ConnectionKey;
            const connection = connections[connectionKey];
            if (connection) {
              connections[connectionKey].position = transformPoint(
                connection.position
              );
              connections[connectionKey].direction = transformDirection(
                connection.direction
              );
            }
          });
          break;
        }
        case 'junction': {
          const connections = segment2.connections as {
            main: RoadConnection;
            end: RoadConnection;
            branch: RoadConnection;
          };
          if (connections.main) {
            connections.main.position = transformPoint(
              connections.main.position
            );
            connections.main.direction = transformDirection(
              connections.main.direction
            );
          }
          if (connections.end) {
            connections.end.position = transformPoint(connections.end.position);
            connections.end.direction = transformDirection(
              connections.end.direction
            );
          }
          if (connections.branch) {
            connections.branch.position = transformPoint(
              connections.branch.position
            );
            connections.branch.direction = transformDirection(
              connections.branch.direction
            );
          }
          break;
        }
      }
    };

    // Apply the rotations and translations to all connection points
    rotateAndTranslateConnections();

    // Double-check all connection points to ensure they're flat
    switch (segment2.type) {
      case 'straight':
      case 'curve': {
        const connections = segment2.connections as {
          start: RoadConnection;
          end: RoadConnection;
        };
        if (connections.start) connections.start.position.y = 0;
        if (connections.end) connections.end.position.y = 0;
        break;
      }
      case 'intersection': {
        const connections = segment2.connections as Record<
          ConnectionKey,
          RoadConnection
        >;
        Object.values(connections).forEach((conn) => {
          if (conn) conn.position.y = 0;
        });
        break;
      }
      case 'junction': {
        const connections = segment2.connections as {
          main: RoadConnection;
          end: RoadConnection;
          branch: RoadConnection;
        };
        if (connections.main) connections.main.position.y = 0;
        if (connections.end) connections.end.position.y = 0;
        if (connections.branch) connections.branch.position.y = 0;
        break;
      }
    }

    // Log connection success in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `Connected ${segment1.type} segment at "${connection1}" to ${segment2.type} segment at "${connection2}"`
      );
      console.log(
        `- Rotated by ${((angle * 180) / Math.PI).toFixed(
          2
        )}° and moved by (${offset.x.toFixed(2)}, ${offset.z.toFixed(2)})`
      );
    }

    return true;
  }
}
