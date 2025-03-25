import { Vector3 } from 'three';
import {
  RoadNetwork,
  RoadSegment,
  StraightRoadSegment,
  CurvedRoadSegment,
  IntersectionRoadSegment
} from '../types/road.types';
import { RoadSegmentFactory } from '../factories/road-segment.factory';

/**
 * Class to configure and build road networks
 */
export class RoadNetworkBuilder {
  private segments: RoadSegment[] = [];
  private name: string;
  private startPoint: Vector3;
  private checkpoints: Vector3[] = [];

  /**
   * Creates a new road network builder
   */
  constructor(name: string, startPoint = new Vector3(0, 0, 0)) {
    this.name = name;
    this.startPoint = startPoint;
  }

  /**
   * Adds a road segment to the network
   */
  addSegment(segment: RoadSegment): RoadNetworkBuilder {
    this.segments.push(segment);
    return this;
  }

  /**
   * Adds a checkpoint position to the network
   */
  addCheckpoint(position: Vector3): RoadNetworkBuilder {
    this.checkpoints.push(position);
    return this;
  }

  /**
   * Connects two segments in the network
   */
  connectSegments<
    T1 extends RoadSegment,
    T2 extends RoadSegment,
    K1 extends keyof T1['connections'] & string,
    K2 extends keyof T2['connections'] & string
  >(
    segment1Index: number,
    connection1Key: K1,
    segment2Index: number,
    connection2Key: K2
  ): RoadNetworkBuilder {
    if (
      segment1Index < 0 ||
      segment1Index >= this.segments.length ||
      segment2Index < 0 ||
      segment2Index >= this.segments.length
    ) {
      throw new Error('Segment index out of bounds');
    }

    const segment1 = this.segments[segment1Index] as T1;
    const segment2 = this.segments[segment2Index] as T2;

    const [updatedSegment1, updatedSegment2] = RoadSegmentFactory.connectSegments<T1, T2, K1, K2>(
      segment1,
      connection1Key,
      segment2,
      connection2Key
    );

    // Update segments in the network
    this.segments[segment1Index] = updatedSegment1;
    this.segments[segment2Index] = updatedSegment2;

    return this;
  }

  /**
   * Builds and returns the completed road network
   */
  build(): RoadNetwork {
    return {
      id: `${this.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: this.name,
      segments: this.segments,
      startPoint: this.startPoint,
      checkpoints: this.checkpoints,
    };
  }

  /**
   * Creates a sample Mill Road network configuration
   */
  static createMillRoadSample(): RoadNetwork {
    const builder = new RoadNetworkBuilder('Mill Road, Cambridge');

    // Create some road segments for Mill Road
    const mainRoad1 = RoadSegmentFactory.createStraight({
      position: new Vector3(0, 0, 0),
      length: 30,
      width: 8,
      lanes: 2,
      pavementWidth: 2.5,
    });

    const curveSegment = RoadSegmentFactory.createCurve({
      position: new Vector3(0, 0, 30),
      radius: 15,
      angle: Math.PI / 4, // 45 degrees
      width: 8,
      lanes: 2,
      pavementWidth: 2.5,
    });

    const mainRoad2 = RoadSegmentFactory.createStraight({
      position: new Vector3(9.1, 0, 40.9), // Position after the curve
      length: 25,
      width: 8,
      lanes: 2,
      pavementWidth: 2.5,
      rotation: new Vector3(0, Math.PI / 4, 0), // Rotated to match curve end
    });

    const intersection = RoadSegmentFactory.createIntersection({
      position: new Vector3(21.8, 0, 53.6), // Position after mainRoad2
      width: 9,
      hasCrosswalk: true,
    });

    const sideRoad = RoadSegmentFactory.createStraight({
      position: new Vector3(30.3, 0, 53.6), // Right of intersection
      length: 20,
      width: 6,
      lanes: 1,
      rotation: new Vector3(0, Math.PI / 2, 0), // Rotated 90 degrees
    });

    // Add segments to the network
    builder
      .addSegment(mainRoad1)
      .addSegment(curveSegment)
      .addSegment(mainRoad2)
      .addSegment(intersection)
      .addSegment(sideRoad);

    // Connect the segments with proper typing
    builder
      .connectSegments<StraightRoadSegment, CurvedRoadSegment, 'end', 'start'>(0, 'end', 1, 'start')
      .connectSegments<CurvedRoadSegment, StraightRoadSegment, 'end', 'start'>(1, 'end', 2, 'start')
      .connectSegments<StraightRoadSegment, IntersectionRoadSegment, 'end', 'north'>(2, 'end', 3, 'north')
      .connectSegments<IntersectionRoadSegment, StraightRoadSegment, 'east', 'start'>(3, 'east', 4, 'start');

    // Add some checkpoints
    builder
      .addCheckpoint(new Vector3(0, 0, 15)) // Middle of first road
      .addCheckpoint(new Vector3(4.5, 0, 35.5)) // Middle of curve
      .addCheckpoint(new Vector3(15.5, 0, 47.2)) // Middle of second road
      .addCheckpoint(new Vector3(40, 0, 53.6)); // End of side road

    return builder.build();
  }
}
