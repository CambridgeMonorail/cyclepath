import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { RoadSegmentFactory } from './road-segment.factory';
import { StraightRoadSegment } from '../types/road.types';

describe('RoadSegmentFactory', () => {
  describe('createStraight', () => {
    it('should create a straight road segment with default values', () => {
      const segment = RoadSegmentFactory.createStraight();

      expect(segment.type).toBe('straight');
      expect(segment.width).toBe(7);
      expect(segment.length).toBe(10);
      expect(segment.pavementWidth).toBe(2);
      expect(segment.lanes).toBe(2);
      expect(segment.hasCrosswalk).toBe(false);

      // Check connections
      expect(segment.connections.start.position.z).toBe(-5); // Half length back
      expect(segment.connections.end.position.z).toBe(5);    // Half length forward
    });

    it('should create a straight road segment with custom values', () => {
      const position = new Vector3(10, 0, 20);
      const segment = RoadSegmentFactory.createStraight({
        position,
        length: 20,
        width: 10,
        pavementWidth: 3,
        lanes: 4,
        hasCrosswalk: true,
      });

      expect(segment.type).toBe('straight');
      expect(segment.position).toBe(position);
      expect(segment.width).toBe(10);
      expect(segment.length).toBe(20);
      expect(segment.pavementWidth).toBe(3);
      expect(segment.lanes).toBe(4);
      expect(segment.hasCrosswalk).toBe(true);

      // Check connections
      expect(segment.connections.start.position.z).toBe(position.z - 10); // Half length back
      expect(segment.connections.end.position.z).toBe(position.z + 10);   // Half length forward
    });
  });

  describe('createCurve', () => {
    it('should create a right curve segment with default values', () => {
      const segment = RoadSegmentFactory.createCurve();

      expect(segment.type).toBe('curve');
      expect(segment.radius).toBe(10);
      expect(segment.angle).toBe(Math.PI / 2); // 90 degrees
      expect(segment.direction).toBe('right');
      expect(segment.length).toBeCloseTo(10 * Math.PI / 2); // radius * angle

      // For a 90-degree right curve, end.x = position.x + radius
      expect(segment.connections.end.position.x).toBeCloseTo(10);
      expect(segment.connections.end.position.z).toBeCloseTo(10);
    });

    it('should create a left curve segment with custom values', () => {
      const position = new Vector3(5, 0, 5);
      const segment = RoadSegmentFactory.createCurve({
        position,
        radius: 20,
        angle: Math.PI / 4, // 45 degrees
        direction: 'left',
        width: 8,
      });

      expect(segment.type).toBe('curve');
      expect(segment.radius).toBe(20);
      expect(segment.angle).toBe(Math.PI / 4);
      expect(segment.direction).toBe('left');
      expect(segment.length).toBeCloseTo(20 * Math.PI / 4); // radius * angle

      // For a 45-degree left curve
      const expectedX = position.x - 20 * Math.sin(Math.PI / 4);
      const expectedZ = position.z + 20 * (1 - Math.cos(Math.PI / 4));

      expect(segment.connections.end.position.x).toBeCloseTo(expectedX);
      expect(segment.connections.end.position.z).toBeCloseTo(expectedZ);
    });
  });

  describe('createIntersection', () => {
    it('should create an intersection with default values', () => {
      const segment = RoadSegmentFactory.createIntersection();

      expect(segment.type).toBe('intersection');
      expect(segment.width).toBe(7);
      expect(segment.length).toBe(7); // Same as width for intersections
      expect(segment.hasCrosswalk).toBe(true);

      // Check connections (all should be half width from center)
      expect(segment.connections.north.position.z).toBe(-3.5);
      expect(segment.connections.south.position.z).toBe(3.5);
      expect(segment.connections.east.position.x).toBe(3.5);
      expect(segment.connections.west.position.x).toBe(-3.5);
    });
  });

  describe('createJunction', () => {
    it('should create a right junction with default values', () => {
      const segment = RoadSegmentFactory.createJunction();

      expect(segment.type).toBe('junction');
      expect(segment.width).toBe(7);
      expect(segment.length).toBe(14);
      expect(segment.branchDirection).toBe('right');
      expect(segment.hasCrosswalk).toBe(true);

      // Check connections
      expect(segment.connections.main.position.z).toBe(-7);
      expect(segment.connections.end.position.z).toBe(7);
      expect(segment.connections.branch.position.x).toBe(3.5); // Half width to the right
    });

    it('should create a left junction with custom values', () => {
      const segment = RoadSegmentFactory.createJunction({
        width: 10,
        length: 20,
        branchDirection: 'left',
      });

      expect(segment.type).toBe('junction');
      expect(segment.width).toBe(10);
      expect(segment.length).toBe(20);
      expect(segment.branchDirection).toBe('left');

      // Check connections
      expect(segment.connections.main.position.z).toBe(-10);
      expect(segment.connections.end.position.z).toBe(10);
      expect(segment.connections.branch.position.x).toBe(-5); // Half width to the left
    });
  });

  describe('connectSegments', () => {
    it('should connect two straight segments properly', () => {
      const segment1 = RoadSegmentFactory.createStraight({
        position: new Vector3(0, 0, 0),
      });

      const segment2 = RoadSegmentFactory.createStraight({
        position: new Vector3(0, 0, 15), // Placed right after the first one
      });

      const [updatedSegment1, updatedSegment2] = RoadSegmentFactory.connectSegments(
        segment1,
        'end' as keyof StraightRoadSegment['connections'],
        segment2,
        'start' as keyof StraightRoadSegment['connections']
      );

      // Check connections are properly linked
      expect(updatedSegment1.connections.end.connectedToId).toBe(segment2.id);
      expect(updatedSegment2.connections.start.connectedToId).toBe(segment1.id);
    });

    it('should throw an error when using invalid connection keys', () => {
      const segment1 = RoadSegmentFactory.createStraight();
      const segment2 = RoadSegmentFactory.createStraight();

      expect(() => {
        RoadSegmentFactory.connectSegments(
          segment1,
          'nonexistent' as keyof StraightRoadSegment['connections'],
          segment2,
          'start' as keyof StraightRoadSegment['connections']
        );
      }).toThrow();
    });
  });
});
