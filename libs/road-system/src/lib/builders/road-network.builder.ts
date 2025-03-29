import { Vector3 } from 'three';
import {
  RoadNetwork,
  RoadSegment,
  StraightRoadSegment,
  CurvedRoadSegment,
} from '../types/road.types';
import { RoadSegmentFactory } from '../factories/road-segment.factory';

// Type guard functions to check segment types
const isStraightSegment = (
  segment: RoadSegment
): segment is StraightRoadSegment => segment.type === 'straight';

const isCurvedSegment = (segment: RoadSegment): segment is CurvedRoadSegment =>
  segment.type === 'curve';

export class RoadNetworkBuilder {
  /**
   * Creates a simple test network with two connected road segments
   */
  static createTestNetwork(): RoadNetwork {
    // Create the first road segment at the origin (0,0,0)
    const segment1 = RoadSegmentFactory.createStraight({
      position: new Vector3(0, 0, 0),
      rotation: new Vector3(0, 0, 0),
      length: 20,
      width: 7,
    });

    // For the second segment, we want to position it correctly at the end of the first segment
    // We'll use the end connection point of the first segment to determine this position
    // and rotate it to continue the road

    // Get the end connection point of the first segment
    const endConnection = segment1.connections.end;

    // Calculate position for second segment
    // We want its start connection to align with the end connection of the first
    // For a properly aligned segment, we place it at the end connection position
    // and adjust the rotation to match the direction

    // Calculate the direction angle from the direction vector
    // Note: Vector2's y component corresponds to z in world space for our road system
    const directionAngle = Math.atan2(
      endConnection.direction.x,
      endConnection.direction.y
    );

    // Create the second segment at the end connection position with the calculated rotation
    const segment2 = RoadSegmentFactory.createStraight({
      position: endConnection.position.clone(),
      rotation: new Vector3(0, directionAngle, 0),
      length: 20,
      width: 7,
    });

    // Log detailed information about segment placement for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Road Network Construction ===');
      console.log('Segment 1:', {
        id: segment1.id,
        position: `(${segment1.position.x.toFixed(
          2
        )}, ${segment1.position.z.toFixed(2)})`,
        rotation: `${((segment1.rotation.y * 180) / Math.PI).toFixed(2)}°`,
        endConnection: `(${endConnection.position.x.toFixed(
          2
        )}, ${endConnection.position.z.toFixed(2)})`,
        endDirection: `(${endConnection.direction.x.toFixed(
          2
        )}, ${endConnection.direction.y.toFixed(2)})`,
      });

      console.log('Segment 2:', {
        id: segment2.id,
        position: `(${segment2.position.x.toFixed(
          2
        )}, ${segment2.position.z.toFixed(2)})`,
        rotation: `${((segment2.rotation.y * 180) / Math.PI).toFixed(2)}°`,
        startConnection: `(${segment2.connections.start.position.x.toFixed(
          2
        )}, ${segment2.connections.start.position.z.toFixed(2)})`,
        startDirection: `(${segment2.connections.start.direction.x.toFixed(
          2
        )}, ${segment2.connections.start.direction.y.toFixed(2)})`,
      });

      // Calculate and log the distance between connection points to validate alignment
      const distance = endConnection.position.distanceTo(
        segment2.connections.start.position
      );
      console.log('Distance between connection points:', distance.toFixed(4));

      // Check if directions are opposite (dot product should be close to -1)
      const dotProduct = endConnection.direction.dot(
        segment2.connections.start.direction
      );
      console.log(
        'Direction alignment (dot product):',
        dotProduct.toFixed(4),
        '(should be close to -1 for perfectly opposite directions)'
      );
    }

    // Connect the segments logically (this doesn't change their positions yet)
    const [updatedSegment1, updatedSegment2] =
      RoadSegmentFactory.connectSegments(segment1, 'end', segment2, 'start');

    // Set starting point for the network using type guards to safely access connections
    let startPoint: Vector3;
    const endPoints: Vector3[] = [];

    if (
      isStraightSegment(updatedSegment1) ||
      isCurvedSegment(updatedSegment1)
    ) {
      startPoint = updatedSegment1.connections.start.position.clone();
      endPoints.push(updatedSegment1.connections.end.position.clone());
    } else {
      // For other segment types, we'd need more complex logic
      // For now, just use the segment position as a fallback
      startPoint = updatedSegment1.position.clone();
    }

    if (
      isStraightSegment(updatedSegment2) ||
      isCurvedSegment(updatedSegment2)
    ) {
      endPoints.push(updatedSegment2.connections.end.position.clone());
    }

    // Define checkpoints (for now just use the endpoints of segments)
    const checkpoints = endPoints;

    // Build and return the network with both segments
    return {
      id: 'test-network',
      name: 'Test Road Network',
      segments: [updatedSegment1, updatedSegment2],
      startPoint,
      checkpoints,
    };
  }

  /**
   * Creates a custom road network from the provided segments
   */
  static createCustomNetwork(segments: RoadSegment[]): RoadNetwork {
    // For future implementation
    throw new Error('Not implemented yet');
  }
}
