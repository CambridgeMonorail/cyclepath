import { Vector2, Vector3 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import {
  RoadSegment,
  StraightRoadSegment,
  CurvedRoadSegment,
  IntersectionRoadSegment,
  JunctionRoadSegment
} from '../types/road.types';

/**
 * Factory class for creating road segments
 */
export class RoadSegmentFactory {
  /**
   * Creates a straight road segment
   */
  static createStraight({
    position = new Vector3(0, 0, 0),
    rotation = new Vector3(0, 0, 0),
    length = 10,
    width = 7,
    pavementWidth = 2,
    lanes = 2,
    hasCrosswalk = false,
    id = uuidv4(),
  }: Partial<Omit<StraightRoadSegment, 'type' | 'connections'>> = {}): StraightRoadSegment {
    // Calculate connection points
    const halfLength = length / 2;

    // Direction vectors (normalized)
    const startDirection = new Vector2(0, -1); // Pointing backward along z-axis
    const endDirection = new Vector2(0, 1);    // Pointing forward along z-axis

    return {
      id,
      type: 'straight',
      position,
      rotation,
      width,
      length,
      pavementWidth,
      lanes,
      hasCrosswalk,
      connections: {
        start: {
          position: new Vector3(position.x, position.y, position.z - halfLength),
          direction: startDirection,
          width,
        },
        end: {
          position: new Vector3(position.x, position.y, position.z + halfLength),
          direction: endDirection,
          width,
        },
      },
    };
  }

  /**
   * Creates a curved road segment
   */
  static createCurve({
    position = new Vector3(0, 0, 0),
    rotation = new Vector3(0, 0, 0),
    radius = 10,
    angle = Math.PI / 2, // 90 degrees by default
    direction = 'right',
    width = 7,
    pavementWidth = 2,
    lanes = 2,
    hasCrosswalk = false,
    id = uuidv4(),
  }: Partial<Omit<CurvedRoadSegment, 'type' | 'connections' | 'length'>> = {}): CurvedRoadSegment {
    // Calculate length based on arc
    const length = radius * angle;

    // Calculate connection points
    const startPos = new Vector3(position.x, position.y, position.z);

    // End position depends on the direction
    let endX, endZ;
    let startDirection, endDirection;

    if (direction === 'right') {
      endX = position.x + radius * Math.sin(angle);
      endZ = position.z + radius * (1 - Math.cos(angle));

      startDirection = new Vector2(0, 1);
      endDirection = new Vector2(Math.sin(angle), Math.cos(angle));
    } else {
      endX = position.x - radius * Math.sin(angle);
      endZ = position.z + radius * (1 - Math.cos(angle));

      startDirection = new Vector2(0, 1);
      endDirection = new Vector2(-Math.sin(angle), Math.cos(angle));
    }

    const endPos = new Vector3(endX, position.y, endZ);

    return {
      id,
      type: 'curve',
      position,
      rotation,
      width,
      length,
      pavementWidth,
      lanes,
      hasCrosswalk,
      radius,
      angle,
      direction,
      connections: {
        start: {
          position: startPos,
          direction: startDirection,
          width,
        },
        end: {
          position: endPos,
          direction: endDirection,
          width,
        },
      },
    };
  }

  /**
   * Creates an intersection road segment
   */
  static createIntersection({
    position = new Vector3(0, 0, 0),
    rotation = new Vector3(0, 0, 0),
    width = 7,
    pavementWidth = 2,
    lanes = 2,
    hasCrosswalk = true,
    id = uuidv4(),
  }: Partial<Omit<IntersectionRoadSegment, 'type' | 'connections' | 'length'>> = {}): IntersectionRoadSegment {
    // For intersections, length is equal to width
    const length = width;

    // Calculate connection points (assumes a square intersection)
    const halfWidth = width / 2;

    return {
      id,
      type: 'intersection',
      position,
      rotation,
      width,
      length,
      pavementWidth,
      lanes,
      hasCrosswalk,
      connections: {
        north: {
          position: new Vector3(position.x, position.y, position.z - halfWidth),
          direction: new Vector2(0, -1),
          width,
        },
        south: {
          position: new Vector3(position.x, position.y, position.z + halfWidth),
          direction: new Vector2(0, 1),
          width,
        },
        east: {
          position: new Vector3(position.x + halfWidth, position.y, position.z),
          direction: new Vector2(1, 0),
          width,
        },
        west: {
          position: new Vector3(position.x - halfWidth, position.y, position.z),
          direction: new Vector2(-1, 0),
          width,
        },
      },
    };
  }

  /**
   * Creates a T-junction road segment
   */
  static createJunction({
    position = new Vector3(0, 0, 0),
    rotation = new Vector3(0, 0, 0),
    width = 7,
    length = 14,
    pavementWidth = 2,
    lanes = 2,
    branchDirection = 'right',
    hasCrosswalk = true,
    id = uuidv4(),
  }: Partial<Omit<JunctionRoadSegment, 'type' | 'connections'>> = {}): JunctionRoadSegment {
    // Calculate connection points
    const halfLength = length / 2;
    const halfWidth = width / 2;

    // Branch position depends on the direction
    const branchX = branchDirection === 'right' ? position.x + halfWidth : position.x - halfWidth;

    return {
      id,
      type: 'junction',
      position,
      rotation,
      width,
      length,
      pavementWidth,
      lanes,
      hasCrosswalk,
      branchDirection,
      connections: {
        main: {
          position: new Vector3(position.x, position.y, position.z - halfLength),
          direction: new Vector2(0, -1),
          width,
        },
        end: {
          position: new Vector3(position.x, position.y, position.z + halfLength),
          direction: new Vector2(0, 1),
          width,
        },
        branch: {
          position: new Vector3(branchX, position.y, position.z),
          direction: new Vector2(branchDirection === 'right' ? 1 : -1, 0),
          width,
        },
      },
    };
  }

  /**
   * Connects two road segments by updating their connection points
   */
  static connectSegments<
    T1 extends RoadSegment,
    T2 extends RoadSegment,
    K1 extends keyof T1['connections'] & string,
    K2 extends keyof T2['connections'] & string,
  >(
    segment1: T1,
    connection1Key: K1,
    segment2: T2,
    connection2Key: K2
  ): [T1, T2] {
    // Get connections
    const connections1 = segment1.connections as Record<K1, { connectedToId?: string }>;
    const connections2 = segment2.connections as Record<K2, { connectedToId?: string }>;

    const conn1 = connections1[connection1Key];
    const conn2 = connections2[connection2Key];

    if (!conn1 || !conn2) {
      throw new Error(`Invalid connection keys: ${String(connection1Key)}, ${String(connection2Key)}`);
    }

    // Update the connection links
    const updatedConn1 = { ...conn1, connectedToId: segment2.id };
    const updatedConn2 = { ...conn2, connectedToId: segment1.id };

    // Return the updated segments with proper type assertions
    const updatedSegment1 = {
      ...segment1,
      connections: {
        ...segment1.connections,
        [connection1Key]: updatedConn1
      }
    };

    const updatedSegment2 = {
      ...segment2,
      connections: {
        ...segment2.connections,
        [connection2Key]: updatedConn2
      }
    };

    return [updatedSegment1 as T1, updatedSegment2 as T2];
  }
}
