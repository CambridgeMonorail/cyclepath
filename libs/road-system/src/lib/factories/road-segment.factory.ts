import { Vector3, Matrix4, Vector2, MathUtils } from 'three';
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
    // Flatten position and rotation for road segments (roads are on XZ plane)
    // Important: we use -Math.PI/2 on the X-axis to rotate the plane from XY to XZ orientation
    const flatPosition = new Vector3(position.x, 0, position.z);

    // Apply the X rotation to align with XZ plane, then add the Y rotation for direction
    const flatRotation = new Vector3(-Math.PI / 2, rotation.y, 0);

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

    // Log the calculated connection points and rotation in degrees for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating straight segment:');
      console.log('- Position:', flatPosition);
      console.log('- Rotation (radians):', flatRotation);
      console.log(
        '- Rotation (degrees):',
        new Vector3(
          MathUtils.radToDeg(flatRotation.x),
          MathUtils.radToDeg(flatRotation.y),
          MathUtils.radToDeg(flatRotation.z)
        )
      );
      console.log('- Length/Width:', length, width);
      console.log('- Start connection:', {
        position: `(${startConnection.position.x.toFixed(
          2
        )}, ${startConnection.position.y.toFixed(
          2
        )}, ${startConnection.position.z.toFixed(2)})`,
        direction: `(${startConnection.direction.x.toFixed(
          2
        )}, ${startConnection.direction.y.toFixed(2)})`,
      });
      console.log('- End connection:', {
        position: `(${endConnection.position.x.toFixed(
          2
        )}, ${endConnection.position.y.toFixed(
          2
        )}, ${endConnection.position.z.toFixed(2)})`,
        direction: `(${endConnection.direction.x.toFixed(
          2
        )}, ${endConnection.direction.y.toFixed(2)})`,
      });
    }

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
        // Ensure texture is oriented correctly for the road
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
    // Flatten position and rotation for road segments (roads are on XZ plane)
    const flatPosition = new Vector3(position.x, 0, position.z);

    // Apply the X rotation to align with XZ plane, then add the Y rotation for direction
    const flatRotation = new Vector3(-Math.PI / 2, rotation.y, 0);

    // Create a rotation matrix for the segment orientation
    const rotationMatrix = new Matrix4().makeRotationY(rotation.y);

    // For a curved segment, the position is at the start of the curve
    // The start connection point is at the segment position
    const startPosition = new Vector3(flatPosition.x, 0, flatPosition.z);

    // Calculate the end position based on radius, angle, and direction
    const endLocal = new Vector3();

    // The direction affects how we calculate the end position
    const angleSign = direction === 'left' ? -1 : 1;

    // Calculate the end position in local space
    if (direction === 'left') {
      // For a left turn, rotate counter-clockwise from the starting direction
      endLocal.set(
        Math.sin(angle) * radius,
        0,
        radius - Math.cos(angle) * radius
      );
    } else {
      // For a right turn, rotate clockwise from the starting direction
      endLocal.set(
        -Math.sin(angle) * radius,
        0,
        radius - Math.cos(angle) * radius
      );
    }

    // Apply rotation to end position and add it to the segment position
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
    // For a curved road, the end direction depends on the curve angle and direction
    const endDirectionAngle = rotation.y + angleSign * angle;

    const endConnection: RoadConnection = {
      position: endPosition,
      direction: new Vector2(
        Math.sin(endDirectionAngle),
        Math.cos(endDirectionAngle)
      ).normalize(),
      width,
    };

    // Log the calculated connection points and rotation in degrees for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating curved segment:');
      console.log('- Position:', flatPosition);
      console.log('- Rotation (radians):', flatRotation);
      console.log(
        '- Rotation (degrees):',
        new Vector3(
          MathUtils.radToDeg(flatRotation.x),
          MathUtils.radToDeg(flatRotation.y),
          MathUtils.radToDeg(flatRotation.z)
        )
      );
      console.log('- Radius:', radius);
      console.log('- Angle (radians):', angle);
      console.log('- Angle (degrees):', MathUtils.radToDeg(angle));
      console.log('- Direction:', direction);
      console.log('- Start connection:', {
        position: `(${startConnection.position.x.toFixed(
          2
        )}, ${startConnection.position.y.toFixed(
          2
        )}, ${startConnection.position.z.toFixed(2)})`,
        direction: `(${startConnection.direction.x.toFixed(
          2
        )}, ${startConnection.direction.y.toFixed(2)})`,
      });
      console.log('- End connection:', {
        position: `(${endConnection.position.x.toFixed(
          2
        )}, ${endConnection.position.y.toFixed(
          2
        )}, ${endConnection.position.z.toFixed(2)})`,
        direction: `(${endConnection.direction.x.toFixed(
          2
        )}, ${endConnection.direction.y.toFixed(2)})`,
      });
    }

    // Return the complete road segment
    return {
      id: uuidv4(),
      type: 'curve',
      position: flatPosition,
      rotation: flatRotation,
      width,
      // In a curved road, length is the arc length
      length: radius * angle,
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
        // Ensure texture is oriented correctly for the road
        rotation: textureOptions.rotation || 0,
      },
    };
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
    // Flatten position and rotation for road segments (roads are on XZ plane)
    const flatPosition = new Vector3(position.x, 0, position.z);

    // Apply the X rotation to align with XZ plane, then add the Y rotation for direction
    const flatRotation = new Vector3(-Math.PI / 2, rotation.y, 0);

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

    // Log debug information
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating intersection segment:');
      console.log('- Position:', flatPosition);
      console.log('- Rotation (radians):', flatRotation);
      console.log('- Width:', width);
      console.log('- North connection:', {
        position: northPosition
          .toArray()
          .map((v) => v.toFixed(2))
          .join(', '),
        direction: northConnection.direction
          .toArray()
          .map((v) => v.toFixed(2))
          .join(', '),
      });
      console.log('- South connection:', {
        position: southPosition
          .toArray()
          .map((v) => v.toFixed(2))
          .join(', '),
        direction: southConnection.direction
          .toArray()
          .map((v) => v.toFixed(2))
          .join(', '),
      });
      console.log('- East connection:', {
        position: eastPosition
          .toArray()
          .map((v) => v.toFixed(2))
          .join(', '),
        direction: eastConnection.direction
          .toArray()
          .map((v) => v.toFixed(2))
          .join(', '),
      });
      console.log('- West connection:', {
        position: westPosition
          .toArray()
          .map((v) => v.toFixed(2))
          .join(', '),
        direction: westConnection.direction
          .toArray()
          .map((v) => v.toFixed(2))
          .join(', '),
      });
    }

    return {
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
    // Flatten position and rotation for road segments (roads are on XZ plane)
    const flatPosition = new Vector3(position.x, 0, position.z);

    // Apply the X rotation to align with XZ plane, then add the Y rotation for direction
    const flatRotation = new Vector3(-Math.PI / 2, rotation.y, 0);

    // Half lengths for calculations
    const halfWidth = width / 2;
    const halfLength = length / 2;

    // Create a rotation matrix for rotating connection points
    const rotationMatrix = new Matrix4().makeRotationY(rotation.y);

    // Calculate connection positions relative to the junction center
    const mainLocal = new Vector3(0, 0, -halfLength);
    const endLocal = new Vector3(0, 0, halfLength);

    // Branch position depends on direction
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
    let branchDirection2D: Vector2;
    if (branchDirection === 'right') {
      branchDirection2D = new Vector2(
        Math.cos(rotation.y),
        -Math.sin(rotation.y)
      ).normalize();
    } else {
      branchDirection2D = new Vector2(
        -Math.cos(rotation.y),
        Math.sin(rotation.y)
      ).normalize();
    }

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
    // Clone segments to avoid mutating the originals
    const updatedSegment1 = { ...segment1 };
    const updatedSegment2 = { ...segment2 };

    // Get connection points using our type-safe helper
    const connection1 = this.getConnection(segment1, connectionKey1);
    const connection2 = this.getConnection(segment2, connectionKey2);

    // Log connection operation for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Connecting segments:');
      console.log(
        `- Segment 1 (${segment1.id}) ${String(connectionKey1)} to Segment 2 (${
          segment2.id
        }) ${String(connectionKey2)}`
      );
      console.log('- Connection 1 position:', connection1.position);
      console.log('- Connection 2 position:', connection2.position);
      console.log(
        '- Distance before alignment:',
        connection1.position.distanceTo(connection2.position).toFixed(4)
      );
    }

    // Note: For now, we're keeping the segments at their original positions
    // This allows us to validate that the segments are properly positioned
    // In a future iteration, we'll implement actual alignment of segments

    return [updatedSegment1, updatedSegment2];
  }
}
