import { Vector3 } from 'three';
import {
  RoadNetwork,
  RoadSegment,
  StraightRoadSegment,
  CurvedRoadSegment,
  RoadConnection,
  RoadSegmentType,
  IntersectionRoadSegment,
  JunctionRoadSegment,
} from '../types/road.types';
import {
  RoadSegmentFactory,
  ConnectionKey,
  CreateStraightOptions,
  CreateCurvedOptions,
  CreateIntersectionOptions,
  CreateJunctionOptions,
} from '../factories/road-segment.factory';
import {
  RoadNetworkLayout,
  RoadNetworkConnection,
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
      // This will throw an error if the connections are invalid
      const connection1 = this.getConnection(segment1, connectionKey1);
      const connection2 = this.getConnection(segment2, connectionKey2);

      // Additional validation could be added here
      // For example, checking if widths are compatible or if directions align

      return true;
    } catch (error) {
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

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `Connected segment ${fromSegmentIndex} to segment ${toSegmentIndex}`
        );
      }
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
    return {
      id: this.id,
      name: this.name,
      segments: updatedSegments,
      startPoint: this.startPoint,
      checkpoints: this.checkpoints,
    };
  }

  /**
   * Build a road network from a layout definition
   *
   * @param layout The road network layout to build
   * @returns A fully constructed road network
   */
  static buildFromLayout(layout: RoadNetworkLayout): RoadNetwork {
    // Create a new builder with the name from the layout
    const builder = new RoadNetworkBuilder(
      layout.options.name || 'Road Network'
    );

    // Set ID if specified
    if (layout.options.id) {
      builder.setId(layout.options.id);
    }

    // Create all segments from their type and parameters
    const segments: RoadSegment[] = layout.segments.map((segmentDef) => {
      // Ensure position is a Vector3 if it exists as an object
      if (
        segmentDef.params.position &&
        !(segmentDef.params.position instanceof Vector3)
      ) {
        const pos = segmentDef.params.position as {
          x: number;
          y: number;
          z: number;
        };
        segmentDef.params.position = new Vector3(pos.x, pos.y, pos.z);
      }

      // Ensure rotation is a Vector3 if it exists as an object
      if (
        segmentDef.params.rotation &&
        !(segmentDef.params.rotation instanceof Vector3)
      ) {
        const rot = segmentDef.params.rotation as {
          x: number;
          y: number;
          z: number;
        };
        segmentDef.params.rotation = new Vector3(rot.x, rot.y, rot.z);
      }

      switch (segmentDef.type) {
        case 'straight':
          return RoadSegmentFactory.createStraight(
            segmentDef.params as CreateStraightOptions
          );
        case 'curve':
          return RoadSegmentFactory.createCurved(
            segmentDef.params as CreateCurvedOptions
          );
        case 'intersection':
          return RoadSegmentFactory.createIntersection(
            segmentDef.params as CreateIntersectionOptions
          );
        case 'junction':
          return RoadSegmentFactory.createJunction(
            segmentDef.params as CreateJunctionOptions
          );
        default:
          throw new Error(`Unknown segment type: ${segmentDef.type}`);
      }
    });

    builder.addSegments(segments);

    // Set the start point if specified
    if (layout.options.startPoint) {
      builder.setStartPoint(layout.options.startPoint);
    }

    // Add checkpoints if specified
    if (layout.options.checkpoints && layout.options.checkpoints.length > 0) {
      builder.addCheckpoints(layout.options.checkpoints);
    }

    // Add all the connections
    for (const connection of layout.connections) {
      builder.connectSegments(
        connection.fromIndex,
        connection.fromConnection,
        connection.toIndex,
        connection.toConnection
      );
    }

    // Build and return the network
    return builder.build();
  }

  /**
   * Creates a simple test network with multiple connected road segments
   * This is maintained for backwards compatibility
   */
  static createTestNetwork(): RoadNetwork {
    // Use the test track layout and build with our new method
    return RoadNetworkBuilder.buildFromLayout(RoadNetworkLayouts.testTrack());
  }

  /**
   * Creates a square road network with 90-degree curved corners
   * Each side of the square consists of two straight segments for more flexibility
   */
  static createSquareNetwork(
    sideLength = 80,
    cornerRadius = 15,
    roadWidth = 7
  ): RoadNetwork {
    // Use the square track layout and build with our new method
    return RoadNetworkBuilder.buildFromLayout(
      RoadNetworkLayouts.square(sideLength, cornerRadius, roadWidth)
    );
  }

  /**
   * Creates a figure-8 racing track
   */
  static createFigure8Network(
    trackWidth = 80,
    cornerRadius = 20,
    roadWidth = 7
  ): RoadNetwork {
    // Use the figure-8 track layout and build with our new method
    return RoadNetworkBuilder.buildFromLayout(
      RoadNetworkLayouts.figure8(trackWidth, cornerRadius, roadWidth)
    );
  }
}
