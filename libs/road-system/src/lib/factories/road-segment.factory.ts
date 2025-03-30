import { Vector3, Matrix4, Vector2 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import {
  RoadSegment,
  RoadConnection,
  StraightRoadSegment,
  CurvedRoadSegment,
  IntersectionRoadSegment,
  JunctionRoadSegment,
  StraightRoadConnections,
  CurvedRoadConnections,
  IntersectionRoadConnections,
  JunctionRoadConnections,
  RoadTextureOptions,
} from '../types/road.types';

// Type for connection keys across all segment types
export type ConnectionKey =
  | 'start'
  | 'end'
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'main'
  | 'branch';

export type CreateStraightOptions = {
  position: Vector3;
  rotation?: Vector3;
  length?: number;
  width?: number;
  pavementWidth?: number;
  lanes?: number;
  hasCrosswalk?: boolean;
  textureOptions?: Partial<RoadTextureOptions>;
};

export type CreateCurvedOptions = {
  position: Vector3;
  rotation?: Vector3;
  radius?: number;
  angle?: number;
  width?: number;
  pavementWidth?: number;
  lanes?: number;
  direction?: 'left' | 'right';
  hasCrosswalk?: boolean;
  textureOptions?: Partial<RoadTextureOptions>;
};

export type CreateIntersectionOptions = {
  position: Vector3;
  rotation?: Vector3;
  width?: number;
  pavementWidth?: number;
  lanes?: number;
  hasCrosswalk?: boolean;
  textureOptions?: Partial<RoadTextureOptions>;
};

export type CreateJunctionOptions = {
  position: Vector3;
  rotation?: Vector3;
  width?: number;
  length?: number;
  pavementWidth?: number;
  lanes?: number;
  branchDirection?: 'left' | 'right';
  hasCrosswalk?: boolean;
  textureOptions?: Partial<RoadTextureOptions>;
};

export class RoadSegmentFactory {
  /**
   * Validates that a position is on the flat surface (y = 0) and corrects it if necessary
   */
  private static validateFlatSurface(position: Vector3, context: string): void {
    if (Math.abs(position.y) > 0.001) {
      console.warn(
        `${context}: Position must be on flat surface (y = 0), got y = ${position.y}. Correcting to y = 0.`
      );
      position.y = 0; // Correct the y-coordinate
    }
  }

  /**
   * Validates that rotation is only around Y axis and corrects it if necessary
   */
  private static validateYAxisRotation(
    rotation: Vector3,
    context: string
  ): void {
    if (Math.abs(rotation.x) > 0.001 || Math.abs(rotation.z) > 0.001) {
      console.warn(
        `${context}: Rotation must be around Y axis only. Got rotation (${rotation.x}, ${rotation.y}, ${rotation.z}). Correcting to Y-axis rotation.`
      );
      rotation.x = 0; // Correct the x-axis rotation
      rotation.z = 0; // Correct the z-axis rotation
    }
  }

  /**
   * Creates a straight road segment with proper connection points
   */
  static createStraight({
    position,
    rotation = new Vector3(0, 0, 0),
    length = 20,
    width = 7,
    pavementWidth = 1.5,
    lanes = 2,
    hasCrosswalk = false,
    textureOptions = {},
  }: CreateStraightOptions): StraightRoadSegment {
    // Validate constraints
    this.validateFlatSurface(position, 'createStraight');
    this.validateYAxisRotation(rotation, 'createStraight');

    // Ensure position is on XZ plane
    const flatPosition = new Vector3(position.x, 0, position.z);
    // Only use Y-axis rotation
    const flatRotation = new Vector3(0, rotation.y, 0);

    // Half the length of the segment (used for connection point calculations)
    const halfLength = length / 2;

    // Create a matrix for rotating points around the Y axis for the connection points
    const rotationMatrix = new Matrix4().makeRotationY(rotation.y);

    // Calculate start position in local space
    const startLocal = new Vector3(0, 0, -halfLength);
    // Transform to world space: apply rotation and then add segment position
    startLocal.applyMatrix4(rotationMatrix);
    const startPosition = new Vector3(
      flatPosition.x + startLocal.x,
      0,
      flatPosition.z + startLocal.z
    );

    // Calculate end position in local space
    const endLocal = new Vector3(0, 0, halfLength);
    // Transform to world space: apply rotation and then add segment position
    endLocal.applyMatrix4(rotationMatrix);
    const endPosition = new Vector3(
      flatPosition.x + endLocal.x,
      0,
      flatPosition.z + endLocal.z
    );

    // Create connection points
    const startConnection: RoadConnection = {
      position: startPosition,
      direction: new Vector2(
        -Math.sin(rotation.y),
        -Math.cos(rotation.y)
      ).normalize(),
      width,
    };

    const endConnection: RoadConnection = {
      position: endPosition,
      direction: new Vector2(
        Math.sin(rotation.y),
        Math.cos(rotation.y)
      ).normalize(),
      width,
    };

    // Return the complete road segment
    return {
      id: uuidv4(),
      type: 'straight',
      position: flatPosition,
      rotation: flatRotation,
      length,
      width,
      pavementWidth,
      lanes,
      hasCrosswalk,
      connections: {
        start: startConnection,
        end: endConnection,
      },
      textureOptions: {
        roadTexture: textureOptions.roadTexture || 'asphalt.jpg',
        normalMap: textureOptions.normalMap || 'asphalt_normal.png',
        roughnessMap: textureOptions.roughnessMap || 'asphalt_roughness.png',
        rotation: textureOptions.rotation || 0,
      },
    };
  }

  /**
   * Creates a curved road segment with proper connection points
   */
  static createCurved({
    position,
    rotation = new Vector3(0, 0, 0),
    radius = 15,
    angle = Math.PI / 2, // Default to 90-degree turn
    width = 7,
    pavementWidth = 1.5,
    lanes = 2,
    direction = 'right',
    hasCrosswalk = false,
    textureOptions = {},
  }: CreateCurvedOptions): CurvedRoadSegment {
    // Validate constraints
    this.validateFlatSurface(position, 'createCurved');
    this.validateYAxisRotation(rotation, 'createCurved');

    // Ensure position is on XZ plane
    const flatPosition = new Vector3(position.x, 0, position.z);
    // Only use Y-axis rotation
    const flatRotation = new Vector3(0, rotation.y, 0);

    // Adjust radius for 90-degree curves to ensure the arc length matches the width
    if (angle === Math.PI / 2) {
      radius = width; // For a square, the radius must equal the width
    }

    // Create a rotation matrix for the segment orientation
    const rotationMatrix = new Matrix4().makeRotationY(rotation.y);

    // For a curved segment, the position is at the start of the curve
    // The start connection point is at the segment position
    const startPosition = new Vector3(flatPosition.x, 0, flatPosition.z);

    // Calculate the end position based on radius, angle, and direction
    const endLocal = new Vector3();
    const angleSign = direction === 'left' ? -1 : 1;

    if (direction === 'left') {
      endLocal.set(
        Math.sin(angle) * radius,
        0,
        radius - Math.cos(angle) * radius
      );
    } else {
      endLocal.set(
        -Math.sin(angle) * radius,
        0,
        radius - Math.cos(angle) * radius
      );
    }

    endLocal.applyMatrix4(rotationMatrix);
    const endPosition = new Vector3(
      flatPosition.x + endLocal.x,
      0,
      flatPosition.z + endLocal.z
    );

    // Create the start connection
    const startConnection: RoadConnection = {
      position: startPosition,
      direction: new Vector2(
        -Math.sin(rotation.y),
        -Math.cos(rotation.y)
      ).normalize(),
      width,
    };

    // Calculate end connection direction
    const endDirectionAngle = rotation.y + angleSign * angle;
    const endConnection: RoadConnection = {
      position: endPosition,
      direction: new Vector2(
        Math.sin(endDirectionAngle),
        Math.cos(endDirectionAngle)
      ).normalize(),
      width,
    };

    // Return the complete road segment
    const segment: CurvedRoadSegment = {
      id: uuidv4(),
      type: 'curve',
      position: flatPosition,
      rotation: flatRotation,
      width,
      length: radius * angle, // Arc length
      pavementWidth,
      lanes,
      hasCrosswalk,
      radius,
      angle,
      direction,
      connections: {
        start: startConnection,
        end: endConnection,
      },
      textureOptions: {
        roadTexture: textureOptions.roadTexture || 'asphalt.jpg',
        normalMap: textureOptions.normalMap || 'asphalt_normal.png',
        roughnessMap: textureOptions.roughnessMap || 'asphalt_roughness.png',
        rotation: textureOptions.rotation || 0,
      },
    };

    return segment;
  }

  /**
   * Creates an intersection road segment with four connection points
   */
  static createIntersection({
    position,
    rotation = new Vector3(0, 0, 0),
    width = 7,
    pavementWidth = 1.5,
    lanes = 2,
    hasCrosswalk = true,
    textureOptions = {},
  }: CreateIntersectionOptions): IntersectionRoadSegment {
    // Validate constraints
    this.validateFlatSurface(position, 'createIntersection');
    this.validateYAxisRotation(rotation, 'createIntersection');

    // Ensure position is on XZ plane
    const flatPosition = new Vector3(position.x, 0, position.z);
    // Only use Y-axis rotation
    const flatRotation = new Vector3(0, rotation.y, 0);

    // Half the width of the intersection
    const halfWidth = width / 2;

    // Create a rotation matrix for rotating connection points
    const rotationMatrix = new Matrix4().makeRotationY(rotation.y);

    // Calculate connection positions relative to the intersection center
    const northLocal = new Vector3(0, 0, -halfWidth);
    const southLocal = new Vector3(0, 0, halfWidth);
    const eastLocal = new Vector3(halfWidth, 0, 0);
    const westLocal = new Vector3(-halfWidth, 0, 0);

    // Apply rotation and translate to world space
    northLocal.applyMatrix4(rotationMatrix);
    southLocal.applyMatrix4(rotationMatrix);
    eastLocal.applyMatrix4(rotationMatrix);
    westLocal.applyMatrix4(rotationMatrix);

    const northPosition = new Vector3(
      flatPosition.x + northLocal.x,
      0,
      flatPosition.z + northLocal.z
    );
    const southPosition = new Vector3(
      flatPosition.x + southLocal.x,
      0,
      flatPosition.z + southLocal.z
    );
    const eastPosition = new Vector3(
      flatPosition.x + eastLocal.x,
      0,
      flatPosition.z + eastLocal.z
    );
    const westPosition = new Vector3(
      flatPosition.x + westLocal.x,
      0,
      flatPosition.z + westLocal.z
    );

    // Create connection points with proper directions
    const northConnection: RoadConnection = {
      position: northPosition,
      direction: new Vector2(
        -Math.sin(rotation.y),
        -Math.cos(rotation.y)
      ).normalize(),
      width,
    };

    const southConnection: RoadConnection = {
      position: southPosition,
      direction: new Vector2(
        Math.sin(rotation.y),
        Math.cos(rotation.y)
      ).normalize(),
      width,
    };

    const eastConnection: RoadConnection = {
      position: eastPosition,
      direction: new Vector2(
        Math.cos(rotation.y),
        -Math.sin(rotation.y)
      ).normalize(),
      width,
    };

    const westConnection: RoadConnection = {
      position: westPosition,
      direction: new Vector2(
        -Math.cos(rotation.y),
        Math.sin(rotation.y)
      ).normalize(),
      width,
    };

    // Create the segment
    const segment: IntersectionRoadSegment = {
      id: uuidv4(),
      type: 'intersection',
      position: flatPosition,
      rotation: flatRotation,
      width,
      length: width, // For intersections, length equals width
      pavementWidth,
      lanes,
      hasCrosswalk,
      connections: {
        north: northConnection,
        south: southConnection,
        east: eastConnection,
        west: westConnection,
      },
      textureOptions: {
        roadTexture: textureOptions.roadTexture || 'asphalt.jpg',
        normalMap: textureOptions.normalMap || 'asphalt_normal.png',
        roughnessMap: textureOptions.roughnessMap || 'asphalt_roughness.png',
        rotation: textureOptions.rotation || 0,
      },
    };

    return segment;
  }

  /**
   * Creates a T-junction road segment with three connection points
   */
  static createJunction({
    position,
    rotation = new Vector3(0, 0, 0),
    width = 7,
    length = 14,
    pavementWidth = 1.5,
    lanes = 2,
    branchDirection = 'right',
    hasCrosswalk = true,
    textureOptions = {},
  }: CreateJunctionOptions): JunctionRoadSegment {
    // Validate constraints
    this.validateFlatSurface(position, 'createJunction');
    this.validateYAxisRotation(rotation, 'createJunction');

    // Ensure position is on XZ plane
    const flatPosition = new Vector3(position.x, 0, position.z);
    // Only use Y-axis rotation
    const flatRotation = new Vector3(0, rotation.y, 0);

    // Half lengths for calculations
    const halfWidth = width / 2;
    const halfLength = length / 2;

    // Create a rotation matrix for rotating connection points
    const rotationMatrix = new Matrix4().makeRotationY(rotation.y);

    // Calculate connection positions relative to the junction center
    const mainLocal = new Vector3(0, 0, -halfLength);
    const endLocal = new Vector3(0, 0, halfLength);
    const branchLocal = new Vector3(
      branchDirection === 'right' ? halfWidth : -halfWidth,
      0,
      0
    );

    // Apply rotation and translate to world space
    mainLocal.applyMatrix4(rotationMatrix);
    endLocal.applyMatrix4(rotationMatrix);
    branchLocal.applyMatrix4(rotationMatrix);

    const mainPosition = new Vector3(
      flatPosition.x + mainLocal.x,
      0,
      flatPosition.z + mainLocal.z
    );
    const endPosition = new Vector3(
      flatPosition.x + endLocal.x,
      0,
      flatPosition.z + endLocal.z
    );
    const branchPosition = new Vector3(
      flatPosition.x + branchLocal.x,
      0,
      flatPosition.z + branchLocal.z
    );

    // Create connection points with proper directions
    const mainConnection: RoadConnection = {
      position: mainPosition,
      direction: new Vector2(
        -Math.sin(rotation.y),
        -Math.cos(rotation.y)
      ).normalize(),
      width,
    };

    const endConnection: RoadConnection = {
      position: endPosition,
      direction: new Vector2(
        Math.sin(rotation.y),
        Math.cos(rotation.y)
      ).normalize(),
      width,
    };

    // Direction for branch depends on branch direction
    const branchDirection2D =
      branchDirection === 'right'
        ? new Vector2(Math.cos(rotation.y), -Math.sin(rotation.y)).normalize()
        : new Vector2(-Math.cos(rotation.y), Math.sin(rotation.y)).normalize();

    const branchConnection: RoadConnection = {
      position: branchPosition,
      direction: branchDirection2D,
      width,
    };

    // Log debug information
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating junction segment:');
      console.log('- Position:', flatPosition);
      console.log('- Rotation (radians):', flatRotation);
      console.log('- Width/Length:', width, length);
      console.log('- Branch direction:', branchDirection);
      console.log('- Main connection:', {
        position: mainPosition
          .toArray()
          .map((v) => v.toFixed(2))
          .join(', '),
        direction: mainConnection.direction
          .toArray()
          .map((v) => v.toFixed(2))
          .join(', '),
      });
      console.log('- End connection:', {
        position: endPosition
          .toArray()
          .map((v) => v.toFixed(2))
          .join(', '),
        direction: endConnection.direction
          .toArray()
          .map((v) => v.toFixed(2))
          .join(', '),
      });
      console.log('- Branch connection:', {
        position: branchPosition
          .toArray()
          .map((v) => v.toFixed(2))
          .join(', '),
        direction: branchConnection.direction
          .toArray()
          .map((v) => v.toFixed(2))
          .join(', '),
      });
    }

    return {
      id: uuidv4(),
      type: 'junction',
      position: flatPosition,
      rotation: flatRotation,
      width,
      length,
      pavementWidth,
      lanes,
      hasCrosswalk,
      branchDirection,
      connections: {
        main: mainConnection,
        end: endConnection,
        branch: branchConnection,
      },
      textureOptions: {
        roadTexture: textureOptions.roadTexture || 'asphalt.jpg',
        normalMap: textureOptions.normalMap || 'asphalt_normal.png',
        roughnessMap: textureOptions.roughnessMap || 'asphalt_roughness.png',
        rotation: textureOptions.rotation || 0,
      },
    };
  }

  /**
   * Type-safe helper to get a connection from a road segment
   */
  private static getConnection(
    segment: RoadSegment,
    connectionKey: ConnectionKey
  ): RoadConnection {
    if (segment.type === 'straight' || segment.type === 'curve') {
      if (connectionKey === 'start' || connectionKey === 'end') {
        return (
          segment.connections as StraightRoadConnections | CurvedRoadConnections
        )[connectionKey];
      }
    } else if (segment.type === 'intersection') {
      if (
        connectionKey === 'north' ||
        connectionKey === 'south' ||
        connectionKey === 'east' ||
        connectionKey === 'west'
      ) {
        return (segment.connections as IntersectionRoadConnections)[
          connectionKey
        ];
      }
    } else if (segment.type === 'junction') {
      if (
        connectionKey === 'main' ||
        connectionKey === 'branch' ||
        connectionKey === 'end'
      ) {
        return (segment.connections as JunctionRoadConnections)[connectionKey];
      }
    }

    throw new Error(
      `Invalid connection key "${String(connectionKey)}" for segment type "${
        segment.type
      }"`
    );
  }

  /**
   * Connects two segments by updating their connection points
   */
  static connectSegments(
    segment1: RoadSegment,
    connectionKey1: ConnectionKey,
    segment2: RoadSegment,
    connectionKey2: ConnectionKey
  ): [RoadSegment, RoadSegment] {
    // Create deep copies to avoid mutating the originals
    const updatedSegment1 = JSON.parse(JSON.stringify(segment1)) as RoadSegment;
    const updatedSegment2 = JSON.parse(JSON.stringify(segment2)) as RoadSegment;

    // Restore Vector objects that were lost in JSON serialization
    updatedSegment1.position = new Vector3().copy(segment1.position);
    updatedSegment1.rotation = new Vector3().copy(segment1.rotation);
    updatedSegment2.position = new Vector3().copy(segment2.position);
    updatedSegment2.rotation = new Vector3().copy(segment2.rotation);

    // Restore Vector objects in connections
    Object.entries(updatedSegment1.connections).forEach(([key, conn]) => {
      conn.position = new Vector3().copy(
        (segment1.connections as Record<string, RoadConnection>)[key].position
      );
      conn.direction = new Vector2().copy(
        (segment1.connections as Record<string, RoadConnection>)[key].direction
      );
    });

    Object.entries(updatedSegment2.connections).forEach(([key, conn]) => {
      conn.position = new Vector3().copy(
        (segment2.connections as Record<string, RoadConnection>)[key].position
      );
      conn.direction = new Vector2().copy(
        (segment2.connections as Record<string, RoadConnection>)[key].direction
      );
    });

    // Get connection points using our type-safe helper
    const connection1 = this.getConnection(updatedSegment1, connectionKey1);
    const connection2 = this.getConnection(updatedSegment2, connectionKey2);

    // Calculate the required adjustment to align the connection points
    const positionDelta = new Vector3().subVectors(
      connection1.position,
      connection2.position
    );

    // Adjust segment2's position to align with segment1's connection point
    updatedSegment2.position.add(positionDelta);

    // Update ALL connection points after position adjustment
    Object.values(updatedSegment2.connections).forEach((conn) => {
      conn.position.add(positionDelta);
    });

    // Update connection IDs to reflect the connection
    connection1.connectedToId = updatedSegment2.id;
    connection2.connectedToId = updatedSegment1.id;

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.group('Connecting segments:');
      console.log(
        `Segment 1 (${updatedSegment1.id}) ${String(
          connectionKey1
        )} to Segment 2 (${updatedSegment2.id}) ${String(connectionKey2)}`
      );
      console.log('Position adjustment:', positionDelta);
      console.groupEnd();
    }

    // Validate the connection
    const finalDistance = connection1.position.distanceTo(connection2.position);
    if (finalDistance > 0.01) {
      throw new Error(
        `Failed to align segments: connection points distance ${finalDistance.toFixed(
          3
        )} units apart`
      );
    }

    return [updatedSegment1, updatedSegment2];
  }
}
