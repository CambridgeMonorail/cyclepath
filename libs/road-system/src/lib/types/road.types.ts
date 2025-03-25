import { Vector2, Vector3 } from 'three';

/**
 * Defines the possible types of road segments
 */
export type RoadSegmentType = 'straight' | 'curve' | 'intersection' | 'junction';

/**
 * Defines a connection point between road segments
 */
export type RoadConnection = {
  position: Vector3;
  direction: Vector2; // normalized 2D vector indicating direction
  width: number;
  connectedToId?: string; // ID of the connected segment
};

/**
 * Connection types for different road segments
 */
export type StraightRoadConnections = {
  start: RoadConnection;
  end: RoadConnection;
};

export type CurvedRoadConnections = {
  start: RoadConnection;
  end: RoadConnection;
};

export type IntersectionRoadConnections = {
  north: RoadConnection;
  south: RoadConnection;
  east: RoadConnection;
  west: RoadConnection;
};

export type JunctionRoadConnections = {
  main: RoadConnection;
  end: RoadConnection;
  branch: RoadConnection;
};

/**
 * Base properties shared by all road segments
 */
export type RoadSegmentBase = {
  id: string;
  type: RoadSegmentType;
  position: Vector3;
  rotation: Vector3;
  width: number;
  length: number;
  pavementWidth: number;
  lanes: number;
  hasCrosswalk: boolean;
};

/**
 * Properties specific to straight road segments
 */
export type StraightRoadSegment = RoadSegmentBase & {
  type: 'straight';
  connections: StraightRoadConnections;
};

/**
 * Properties specific to curved road segments
 */
export type CurvedRoadSegment = RoadSegmentBase & {
  type: 'curve';
  radius: number;
  angle: number; // in radians
  direction: 'left' | 'right';
  connections: CurvedRoadConnections;
};

/**
 * Properties specific to intersection segments
 */
export type IntersectionRoadSegment = RoadSegmentBase & {
  type: 'intersection';
  connections: IntersectionRoadConnections;
};

/**
 * Properties specific to junction segments (T-junctions)
 */
export type JunctionRoadSegment = RoadSegmentBase & {
  type: 'junction';
  connections: JunctionRoadConnections;
  branchDirection: 'left' | 'right';
};

/**
 * Union type of all possible road segment types
 */
export type RoadSegment =
  | StraightRoadSegment
  | CurvedRoadSegment
  | IntersectionRoadSegment
  | JunctionRoadSegment;

/**
 * Properties of a road network
 */
export type RoadNetwork = {
  id: string;
  name: string;
  segments: RoadSegment[];
  startPoint: Vector3;
  checkpoints: Vector3[];
};
