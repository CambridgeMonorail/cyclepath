import { Vector3, Vector2 } from 'three';
import {
  RoadNetwork,
  RoadSegment,
  StraightRoadSegment,
  CurvedRoadSegment,
  RoadConnection,
} from '../types/road.types';
import {
  RoadSegmentFactory,
  ConnectionKey,
  CreateRoadSegmentOptions,
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
  private validationIssues: string[] = [];

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
      this.validationIssues.push('Cannot connect a segment to itself');
    }

    if (
      fromSegmentIndex < 0 ||
      fromSegmentIndex >= this.segments.length ||
      toSegmentIndex < 0 ||
      toSegmentIndex >= this.segments.length
    ) {
      this.validationIssues.push('Segment index out of bounds');
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
    // Use the RoadSegmentFactory.getConnection method to handle compass point connections
    const connection = RoadSegmentFactory.getConnection(segment, connectionKey);

    if (connection) {
      return connection;
    }

    // If connection is null, handle the error case
    const errorMsg = `Invalid connection key "${String(
      connectionKey
    )}" for segment type "${segment.type}"`;
    this.validationIssues.push(errorMsg);
    console.warn(`[RoadNetwork] ${errorMsg}`);

    // Return a default connection to prevent rendering failures
    return {
      position: segment.position.clone(),
      direction: new Vector2(1, 0), // Default direction (forward/east)
      width: segment.width,
    };
  }

  /**
   * Validates that all segments in the network are on the same plane
   */
  private validateFlatSurface(): void {
    for (const segment of this.segments) {
      if (Math.abs(segment.position.y) > 0.001) {
        this.validationIssues.push(
          `Segment ${segment.id} is not on flat surface (y = 0), got y = ${segment.position.y}`
        );
      }

      // Check all connection points
      Object.values(segment.connections).forEach((connection) => {
        if (Math.abs(connection.position.y) > 0.001) {
          this.validationIssues.push(
            `Connection point on segment ${segment.id} is not on flat surface (y = 0), got y = ${connection.position.y}`
          );
        }
      });
    }
  }

  /**
   * Validates that all segments only have Y-axis rotation
   */
  private validateYAxisRotation(): void {
    for (const segment of this.segments) {
      if (
        Math.abs(segment.rotation.x) > 0.001 ||
        Math.abs(segment.rotation.z) > 0.001
      ) {
        this.validationIssues.push(
          `Segment ${segment.id} has invalid rotation. Must be Y-axis only. Got rotation (${segment.rotation.x}, ${segment.rotation.y}, ${segment.rotation.z})`
        );
      }
    }
  }

  /**
   * Validates that connected segments are properly aligned
   */
  private validateConnectionAlignment(): void {
    for (const connection of this.connections) {
      const segment1 = this.segments[connection.fromSegmentIndex];
      const segment2 = this.segments[connection.toSegmentIndex];

      const conn1 = this.getConnection(segment1, connection.fromConnectionKey);
      const conn2 = this.getConnection(segment2, connection.toConnectionKey);

      const distance = conn1.position.distanceTo(conn2.position);
      if (distance > 0.01) {
        this.validationIssues.push(
          `Segments ${segment1.id} and ${
            segment2.id
          } are not properly aligned. Connection points are ${distance.toFixed(
            3
          )} units apart`
        );
      }
    }
  }

  /**
   * Validate the road network structure
   */
  validate(): boolean {
    this.validationIssues = []; // Clear previous issues

    // Check if there are segments
    if (this.segments.length === 0) {
      this.validationIssues.push('Network must have at least one segment');
    }

    // Check if there's a start point
    if (!this.startPoint) {
      this.validationIssues.push('Network must have a start point');
    }

    // Validate flat surface constraint
    this.validateFlatSurface();

    // Validate Y-axis rotation constraint
    this.validateYAxisRotation();

    // Validate connection alignment
    this.validateConnectionAlignment();

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
        this.validationIssues.push(
          `Cannot connect segment ${fromSegmentIndex} (${
            segment1.type
          }) at ${String(fromConnectionKey)} to segment ${toSegmentIndex} (${
            segment2.type
          }) at ${String(toConnectionKey)}`
        );
      }
    }

    // Log all validation issues but don't prevent rendering
    if (this.validationIssues.length > 0) {
      console.warn(
        `[RoadNetwork] Validation found ${this.validationIssues.length} issues:`
      );
      this.validationIssues.forEach((issue, index) => {
        console.warn(`[RoadNetwork] Issue #${index + 1}: ${issue}`);
      });
    }

    return this.validationIssues.length === 0;
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

    // Validate the network but continue even if validation fails
    // Just log warnings instead of stopping execution
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

      try {
        // Connect the segments (returns success boolean, doesn't modify segments in place)
        const success = RoadSegmentFactory.connectSegments(
          segment1,
          fromConnectionKey as ConnectionKey,
          segment2,
          toConnectionKey as ConnectionKey
        );

        if (!success) {
          console.warn(
            `[RoadNetwork] Failed to connect segment ${fromSegmentIndex} to ${toSegmentIndex}`
          );
        }
      } catch (error: unknown) {
        // Log connection errors but continue building
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.warn(
          `[RoadNetwork] Error connecting segments: ${errorMessage}`
        );
        console.warn(
          `- From: Segment ${fromSegmentIndex} (${segment1.type}) at ${fromConnectionKey}`
        );
        console.warn(
          `- To: Segment ${toSegmentIndex} (${segment2.type}) at ${toConnectionKey}`
        );
      }
    }

    // If no startPoint was explicitly set, default to the first segment's start
    if (!this.startPoint && updatedSegments.length > 0) {
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
      startPoint: this.startPoint || new Vector3(0, 0, 0), // Provide default if missing
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
    const builder = new RoadNetworkBuilder(
      layout.options.name || 'Road Network'
    );

    // Create all segments from the layout definition
    const segments = layout.segments.map((segmentDef) => {
      // Cast parameters and use the appropriate factory method
      const params: CreateRoadSegmentOptions = {
        position: new Vector3().copy(segmentDef.params.position as Vector3),
        rotation: segmentDef.params.rotation as number, // Now using scalar rotation
        width: segmentDef.params.width as number,
        pavementWidth: segmentDef.params.pavementWidth,
        lanes: segmentDef.params.lanes,
        hasCrosswalk: segmentDef.params.hasCrosswalk,
        textureOptions: segmentDef.params.textureOptions,
      };

      // Create segment based on type
      switch (segmentDef.type) {
        case 'straight':
          return RoadSegmentFactory.createStraight(params);
        case 'curve':
          return RoadSegmentFactory.createCurve(params);
        case 'intersection':
          return RoadSegmentFactory.createIntersection(params);
        case 'junction':
          return RoadSegmentFactory.createTJunction(params);
        case 'dead-end':
          return RoadSegmentFactory.createDeadEnd(params);
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
    if (layout.options.checkpoints && layout.options.checkpoints.length > 0) {
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
   * Creates a square track network
   * @param sideLength Length of each side of the square (default: 80)
   * @param roadWidth Width of the road segments (default: 7)
   */
  static createSquareNetwork(sideLength = 80, roadWidth = 7): RoadNetwork {
    const layout = RoadNetworkLayouts.square(sideLength, roadWidth);
    return RoadNetworkBuilder.createFromLayout(layout);
  }

  /**
   * Creates a test track with a simple curve
   * @param roadWidth Width of the road segments (default: 7)
   */
  static createTestTrack(roadWidth = 7): RoadNetwork {
    const layout = RoadNetworkLayouts.testTrack(roadWidth);
    return RoadNetworkBuilder.createFromLayout(layout);
  }

  /**
   * Creates a figure-8 track
   * @param trackWidth Width of the track (default: 80)
   * @param roadWidth Width of the road segments (default: 7)
   */
  static createFigure8Network(trackWidth = 80, roadWidth = 7): RoadNetwork {
    const layout = RoadNetworkLayouts.figure8(trackWidth, roadWidth);
    return RoadNetworkBuilder.createFromLayout(layout);
  }

  /**
   * Creates a simple intersection with four roads
   * @param roadLength Length of each road segment (default: 21)
   * @param roadWidth Width of the road segments (default: 7)
   */
  static createIntersectionNetwork(
    roadLength = 21,
    roadWidth = 7
  ): RoadNetwork {
    const layout = RoadNetworkLayouts.intersection(roadLength, roadWidth);
    return RoadNetworkBuilder.createFromLayout(layout);
  }
}

/**
 * Error thrown when trying to connect incompatible road segments
 */
export class RoadNetworkValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoadNetworkValidationError';
  }
}
