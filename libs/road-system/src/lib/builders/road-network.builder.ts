import { Vector3 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import { RoadNetwork, RoadSegment } from '../types/road.types';
import { RoadSegmentFactory } from '../factories/road-segment.factory';

export class RoadNetworkBuilder {
  private segments: RoadSegment[] = [];
  private checkpoints: Vector3[] = [];
  private startPoint: Vector3 = new Vector3(0, 0, 0);

  /**
   * Creates a simple test network representing a portion of Mill Road
   */
  static createTestNetwork(): RoadNetwork {
    const builder = new RoadNetworkBuilder();

    // Start with a straight segment
    const start = RoadSegmentFactory.createStraight({
      position: new Vector3(0, 0, 0),
      length: 20,
      width: 7,
    });
    builder.addSegment(start);
    builder.setStartPoint(start.connections.start.position);

    // Add a slight curve
    const curve1 = RoadSegmentFactory.createCurve({
      position: start.connections.end.position,
      radius: 15,
      angle: Math.PI / 6, // 30 degrees
      direction: 'right',
    });
    builder.addSegment(curve1);

    // Add another straight segment
    const straight2 = RoadSegmentFactory.createStraight({
      position: curve1.connections.end.position,
      length: 15,
      rotation: new Vector3(0, Math.PI / 6, 0), // Match the curve exit angle
    });
    builder.addSegment(straight2);

    // Add a T-junction
    const junction = RoadSegmentFactory.createJunction({
      position: straight2.connections.end.position,
      rotation: new Vector3(0, Math.PI / 6, 0),
    });
    builder.addSegment(junction);

    // Connect all segments
    RoadSegmentFactory.connectSegments(start, 'end', curve1, 'start');
    RoadSegmentFactory.connectSegments(curve1, 'end', straight2, 'start');
    RoadSegmentFactory.connectSegments(straight2, 'end', junction, 'main');

    // Add checkpoints at key positions
    builder.addCheckpoint(start.position);
    builder.addCheckpoint(curve1.position);
    builder.addCheckpoint(straight2.position);
    builder.addCheckpoint(junction.position);

    return builder.build();
  }

  addSegment(segment: RoadSegment): this {
    this.segments.push(segment);
    return this;
  }

  setStartPoint(point: Vector3): this {
    this.startPoint = point;
    return this;
  }

  addCheckpoint(point: Vector3): this {
    this.checkpoints.push(point);
    return this;
  }

  build(): RoadNetwork {
    return {
      id: uuidv4(),
      name: 'Mill Road Test Network',
      segments: this.segments,
      startPoint: this.startPoint,
      checkpoints: this.checkpoints,
    };
  }
}
