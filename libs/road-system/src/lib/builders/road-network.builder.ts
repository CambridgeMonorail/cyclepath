import { Vector3 } from 'three';
import {
  RoadNetwork,
  RoadSegment,
  StraightRoadSegment,
  CurvedRoadSegment,
  RoadConnection,
  IntersectionRoadSegment,
  JunctionRoadSegment,
} from '../types/road.types';
import {
  RoadSegmentFactory,
  ConnectionKey,
} from '../factories/road-segment.factory';
import {
  RoadNetworkLayout,
  RoadNetworkLayouts,
} from '../layouts/road-network.layouts';
import { v4 as uuidv4 } from 'uuid';

// Type guard functions to check segment types
const isStraightSegment = (
  segment: RoadSegment
): segment is StraightRoadSegment => segment.type === 'straight';

const isCurvedSegment = (segment: RoadSegment): segment is CurvedRoadSegment =>
  segment.type === 'curve';

const isIntersectionSegment = (
  segment: RoadSegment
): segment is IntersectionRoadSegment => segment.type === 'intersection';

const isJunctionSegment = (
  segment: RoadSegment
): segment is JunctionRoadSegment => segment.type === 'junction';

/**
 * Helper type for segment connection mapping. Defines which segment connects to which,
 * and which connection points should be connected.
 */
type SegmentConnection = {
  fromSegmentIndex: number;
  fromConnectionKey: ConnectionKey;
  toSegmentIndex: number;
  toConnectionKey: ConnectionKey;
};

/**
 * Error thrown when trying to connect incompatible road segments
 */
export class RoadNetworkValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoadNetworkValidationError';
  }
}

/**
 * RoadNetworkBuilder provides a flexible way to create road networks
 * using a builder pattern. It includes validation to ensure segments
 * can only connect at compatible points.
 */
export class RoadNetworkBuilder {
  private id: string;
  private name: string;
  private segments: RoadSegment[] = [];
  private startPoint?: Vector3;
  private checkpoints: Vector3[] = [];
  private connections: SegmentConnection[] = [];
  private isBuilt = false;

  /**
   * Creates a new RoadNetworkBuilder instance
   */
  constructor(name = 'Road Network') {
    this.id = uuidv4();
    this.name = name;
  }

  /**
   * Set the ID for the road network
   */
  setId(id: string): RoadNetworkBuilder {
    this.id = id;
    return this;
  }

  /**
   * Set the name for the road network
   */
  setName(name: string): RoadNetworkBuilder {
    this.name = name;
    return this;
  }

  /**
   * Add a road segment to the network
   */
  addSegment(segment: RoadSegment): RoadNetworkBuilder {
    this.segments.push(segment);
    return this;
  }

  /**
   * Add multiple road segments to the network
   */
  addSegments(segments: RoadSegment[]): RoadNetworkBuilder {
    this.segments.push(...segments);
    return this;
  }

  /**
   * Set the starting point for the road network
   */
  setStartPoint(point: Vector3): RoadNetworkBuilder {
    this.startPoint = point.clone();
    return this;
  }

  /**
   * Add a checkpoint to the road network
   */
  addCheckpoint(point: Vector3): RoadNetworkBuilder {
    this.checkpoints.push(point.clone());
    return this;
  }

  /**
   * Add multiple checkpoints to the road network
   */
  addCheckpoints(points: Vector3[]): RoadNetworkBuilder {
    this.checkpoints.push(...points.map((p) => p.clone()));
    return this;
  }

  /**
   * Define a connection between two segments
   */
  connectSegments(
    fromSegmentIndex: number,
    fromConnectionKey: ConnectionKey,
    toSegmentIndex: number,
    toConnectionKey: ConnectionKey
  ): RoadNetworkBuilder {
    if (process.env.NODE_ENV === 'development') {
      console.group(
        `Connecting segments ${fromSegmentIndex} → ${toSegmentIndex}`
      );

      const fromSegment = this.segments[fromSegmentIndex];
      const toSegment = this.segments[toSegmentIndex];

      console.log('From segment:', {
        id: fromSegment.id,
        type: fromSegment.type,
        position: `(${fromSegment.position.x.toFixed(
          2
        )}, ${fromSegment.position.y.toFixed(
          2
        )}, ${fromSegment.position.z.toFixed(2)})`,
        connection: fromConnectionKey,
      });

      console.log('To segment:', {
        id: toSegment.id,
        type: toSegment.type,
        position: `(${toSegment.position.x.toFixed(
          2
        )}, ${toSegment.position.y.toFixed(2)}, ${toSegment.position.z.toFixed(
          2
        )})`,
        connection: toConnectionKey,
      });

      const fromConn = this.getConnection(fromSegment, fromConnectionKey);
      const toConn = this.getConnection(toSegment, toConnectionKey);

      console.log('Connection points:', {
        from: `(${fromConn.position.x.toFixed(
          2
        )}, ${fromConn.position.y.toFixed(2)}, ${fromConn.position.z.toFixed(
          2
        )})`,
        to: `(${toConn.position.x.toFixed(2)}, ${toConn.position.y.toFixed(
          2
        )}, ${toConn.position.z.toFixed(2)})`,
        distance: fromConn.position.distanceTo(toConn.position).toFixed(2),
      });

      console.groupEnd();
    }

    if (fromSegmentIndex === toSegmentIndex) {
      throw new RoadNetworkValidationError(
        'Cannot connect a segment to itself'
      );
    }

    if (
      fromSegmentIndex < 0 ||
      fromSegmentIndex >= this.segments.length ||
      toSegmentIndex < 0 ||
      toSegmentIndex >= this.segments.length
    ) {
      throw new RoadNetworkValidationError('Segment index out of bounds');
    }

    // Store the connection to be processed during the build phase
    this.connections.push({
      fromSegmentIndex,
      fromConnectionKey,
      toSegmentIndex,
      toConnectionKey,
    });

    return this;
  }

  /**
   * Check if two segments can be connected at the specified connection points
   */
  private canConnect(
    segment1: RoadSegment,
    connectionKey1: ConnectionKey,
    segment2: RoadSegment,
    connectionKey2: ConnectionKey
  ): boolean {
    try {
      // Just check if we can get valid connections for both segments
      this.getConnection(segment1, connectionKey1);
      this.getConnection(segment2, connectionKey2);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get a connection point from a segment by key
   */
  private getConnection(
    segment: RoadSegment,
    connectionKey: ConnectionKey
  ): RoadConnection {
    // Straight and curved segments have 'start' and 'end' connections
    if (isStraightSegment(segment) || isCurvedSegment(segment)) {
      if (connectionKey === 'start' || connectionKey === 'end') {
        return segment.connections[connectionKey];
      }
    }
    // Intersections have 'north', 'south', 'east', 'west' connections
    else if (isIntersectionSegment(segment)) {
      if (
        connectionKey === 'north' ||
        connectionKey === 'south' ||
        connectionKey === 'east' ||
        connectionKey === 'west'
      ) {
        return segment.connections[connectionKey];
      }
    }
    // Junctions have 'main', 'end', 'branch' connections
    else if (isJunctionSegment(segment)) {
      if (
        connectionKey === 'main' ||
        connectionKey === 'end' ||
        connectionKey === 'branch'
      ) {
        return segment.connections[connectionKey];
      }
    }

    throw new RoadNetworkValidationError(
      `Invalid connection key "${String(connectionKey)}" for segment type "${
        segment.type
      }"`
    );
  }

  /**
   * Validate the road network structure
   */
  validate(): boolean {
    // Check if there are segments
    if (this.segments.length === 0) {
      throw new RoadNetworkValidationError(
        'Network must have at least one segment'
      );
    }

    // Check if there's a start point
    if (!this.startPoint) {
      throw new RoadNetworkValidationError('Network must have a start point');
    }

    // Validate connections
    for (const connection of this.connections) {
      const {
        fromSegmentIndex,
        fromConnectionKey,
        toSegmentIndex,
        toConnectionKey,
      } = connection;
      const segment1 = this.segments[fromSegmentIndex];
      const segment2 = this.segments[toSegmentIndex];

      if (
        !this.canConnect(segment1, fromConnectionKey, segment2, toConnectionKey)
      ) {
        throw new RoadNetworkValidationError(
          `Cannot connect segment ${fromSegmentIndex} (${
            segment1.type
          }) at ${String(fromConnectionKey)} to segment ${toSegmentIndex} (${
            segment2.type
          }) at ${String(toConnectionKey)}`
        );
      }
    }

    return true;
  }

  /**
   * Build the road network
   */
  build(): RoadNetwork {
    if (process.env.NODE_ENV === 'development') {
      console.group('Building road network');
      console.log('Total segments:', this.segments.length);
      console.log('Total connections:', this.connections.length);
    }

    if (this.isBuilt) {
      throw new Error('This builder has already been used');
    }

    // Validate the network
    this.validate();

    // Process all connections
    const updatedSegments = [...this.segments];

    for (const connection of this.connections) {
      const {
        fromSegmentIndex,
        fromConnectionKey,
        toSegmentIndex,
        toConnectionKey,
      } = connection;

      // Get the current state of the segments
      const segment1 = updatedSegments[fromSegmentIndex];
      const segment2 = updatedSegments[toSegmentIndex];

      // Connect the segments and get the updated versions
      const [updatedSegment1, updatedSegment2] =
        RoadSegmentFactory.connectSegments(
          segment1,
          fromConnectionKey as ConnectionKey,
          segment2,
          toConnectionKey as ConnectionKey
        );

      // Update the segments in the array
      updatedSegments[fromSegmentIndex] = updatedSegment1;
      updatedSegments[toSegmentIndex] = updatedSegment2;
    }

    // If no startPoint was explicitly set, default to the first segment's start
    if (!this.startPoint) {
      const firstSegment = updatedSegments[0];
      if (isStraightSegment(firstSegment) || isCurvedSegment(firstSegment)) {
        this.startPoint = firstSegment.connections.start.position.clone();
      } else {
        this.startPoint = firstSegment.position.clone();
      }
    }

    this.isBuilt = true;

    // Build and return the network
    const network = {
      id: this.id,
      name: this.name,
      segments: updatedSegments,
      startPoint: this.startPoint,
      checkpoints: this.checkpoints,
    };

    if (process.env.NODE_ENV === 'development') {
      console.groupEnd();
    }

    return network;
  }

  /**
   * Creates a network from a layout definition
   */
  static createFromLayout(layout: RoadNetworkLayout): RoadNetwork {
    const builder = new RoadNetworkBuilder(layout.options.name);

    // Create all segments from the layout definition with proper type casting
    const segments = layout.segments.map((segmentDef) => {
      // Cast the params to the correct type for each segment type
      switch (segmentDef.type) {
        case 'straight': {
          const { position, rotation, length, width } = segmentDef.params;
          return RoadSegmentFactory.createStraight({
            position: new Vector3(position.x, position.y, position.z),
            rotation: new Vector3(rotation.x, rotation.y, rotation.z),
            length,
            width,
          });
        }
        case 'curve': {
          const { position, rotation, radius, angle, direction, width } =
            segmentDef.params;
          return RoadSegmentFactory.createCurved({
            position: new Vector3(position.x, position.y, position.z),
            rotation: new Vector3(rotation.x, rotation.y, rotation.z),
            radius,
            angle,
            direction,
            width,
          });
        }
        case 'intersection': {
          const { position, rotation, width } = segmentDef.params;
          return RoadSegmentFactory.createIntersection({
            position: new Vector3(position.x, position.y, position.z),
            rotation: new Vector3(rotation.x, rotation.y, rotation.z),
            width,
          });
        }
        case 'junction': {
          const { position, rotation, width } = segmentDef.params;
          return RoadSegmentFactory.createJunction({
            position: new Vector3(position.x, position.y, position.z),
            rotation: new Vector3(rotation.x, rotation.y, rotation.z),
            width,
          });
        }
        default:
          throw new Error(`Unknown segment type: ${segmentDef.type}`);
      }
    });

    // Add segments to builder
    builder.addSegments(segments);

    // Set the start point
    if (layout.options.startPoint) {
      builder.setStartPoint(layout.options.startPoint);
    }

    // Add checkpoints if defined
    if (layout.options.checkpoints) {
      builder.addCheckpoints(layout.options.checkpoints);
    }

    // Connect all segments according to layout
    layout.connections.forEach((conn) => {
      builder.connectSegments(
        conn.fromIndex,
        conn.fromConnection,
        conn.toIndex,
        conn.toConnection
      );
    });

    return builder.build();
  }

  /**
   * Creates a square track network with 90-degree curved corners
   * @param sideLength Length of each side of the square (default: 80)
   * @param cornerRadius Radius of the curved corners (default: 15)
   * @param roadWidth Width of the road segments (default: 7)
   */
  static createSquareNetwork(
    sideLength = 80,
    cornerRadius = 15,
    roadWidth = 7
  ): RoadNetwork {
    const layout = RoadNetworkLayouts.square(
      sideLength,
      cornerRadius,
      roadWidth
    );
    return RoadNetworkBuilder.createFromLayout(layout);
  }
}
