import { Vector3, Matrix4, Vector2 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import {
  RoadSegment,
  RoadConnection,
  StraightRoadSegment,
  StraightRoadConnections,
  CurvedRoadConnections,
  IntersectionRoadConnections,
  JunctionRoadConnections,
  RoadTextureOptions
} from '../types/road.types';

// Type for connection keys across all segment types
export type ConnectionKey = 'start' | 'end' | 'north' | 'south' | 'east' | 'west' | 'main' | 'branch';

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
    // Flatten position and rotation to be aligned with the XZ plane
    const flatPosition = new Vector3(position.x, 0, position.z);
    const flatRotation = new Vector3(0, rotation.y, 0);

    // Half the length of the segment (used for connection point calculations)
    const halfLength = length / 2;

    // Create a matrix for rotating points around the Y axis
    const rotationMatrix = new Matrix4().makeRotationY(flatRotation.y);

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
        -Math.sin(flatRotation.y),
        -Math.cos(flatRotation.y)
      ).normalize(),
      width,
    };

    const endConnection: RoadConnection = {
      position: endPosition,
      direction: new Vector2(
        Math.sin(flatRotation.y),
        Math.cos(flatRotation.y)
      ).normalize(),
      width,
    };

    // Log the calculated connection points for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating straight segment:');
      console.log('- Position:', flatPosition);
      console.log('- Rotation:', flatRotation);
      console.log('- Length/Width:', length, width);
      console.log('- Start connection:', {
        position: `(${startConnection.position.x.toFixed(2)}, ${startConnection.position.y.toFixed(2)}, ${startConnection.position.z.toFixed(2)})`,
        direction: `(${startConnection.direction.x.toFixed(2)}, ${startConnection.direction.y.toFixed(2)})`
      });
      console.log('- End connection:', {
        position: `(${endConnection.position.x.toFixed(2)}, ${endConnection.position.y.toFixed(2)}, ${endConnection.position.z.toFixed(2)})`,
        direction: `(${endConnection.direction.x.toFixed(2)}, ${endConnection.direction.y.toFixed(2)})`
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
        return (segment.connections as StraightRoadConnections | CurvedRoadConnections)[connectionKey];
      }
    } else if (segment.type === 'intersection') {
      if (connectionKey === 'north' || connectionKey === 'south' ||
          connectionKey === 'east' || connectionKey === 'west') {
        return (segment.connections as IntersectionRoadConnections)[connectionKey];
      }
    } else if (segment.type === 'junction') {
      if (connectionKey === 'main' || connectionKey === 'branch' || connectionKey === 'end') {
        return (segment.connections as JunctionRoadConnections)[connectionKey];
      }
    }

    throw new Error(`Invalid connection key "${String(connectionKey)}" for segment type "${segment.type}"`);
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
      console.log(`- Segment 1 (${segment1.id}) ${String(connectionKey1)} to Segment 2 (${segment2.id}) ${String(connectionKey2)}`);
      console.log('- Connection 1 position:', connection1.position);
      console.log('- Connection 2 position:', connection2.position);
      console.log('- Distance before alignment:', connection1.position.distanceTo(connection2.position).toFixed(4));
    }

    // Note: For now, we're keeping the segments at their original positions
    // This allows us to validate that the segments are properly positioned
    // In a future iteration, we'll implement actual alignment of segments

    return [updatedSegment1, updatedSegment2];
  }
}
