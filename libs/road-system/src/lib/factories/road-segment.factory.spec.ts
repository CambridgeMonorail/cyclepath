import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoadSegmentFactory } from './road-segment.factory';
import type { Vector3 as ThreeVector3 } from 'three';

// Mock Three.js modules
// This must be BEFORE any class definitions to avoid hoisting issues
vi.mock('three', () => {
  // Define the mock implementation inside the factory function
  const Vector3Mock = class {
    x: number;
    y: number;
    z: number;
    isVector3 = true;

    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }

    clone() {
      return new Vector3Mock(this.x, this.y, this.z);
    }

    add(v: any) {
      this.x += v.x;
      this.y += v.y;
      this.z += v.z;
      return this;
    }

    set(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }

    toArray() {
      return [this.x, this.y, this.z];
    }

    copy(v: any) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      return this;
    }
  };

  const Vector2Mock = class {
    x: number;
    y: number;
    isVector2 = true;

    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }

    clone() {
      return new Vector2Mock(this.x, this.y);
    }

    normalize() {
      const length = Math.sqrt(this.x * this.x + this.y * this.y);
      if (length > 0) {
        this.x /= length;
        this.y /= length;
      }
      return this;
    }
  };

  return {
    Vector3: Vector3Mock,
    Vector2: Vector2Mock,
  };
});

// Mock UUID to ensure consistent IDs in tests
vi.mock('uuid', () => ({
  v4: () => 'test-uuid',
}));

describe('RoadSegmentFactory', () => {
  // Define Vector3 to use in tests
  let Vector3: any;

  beforeEach(() => {
    // Import mocked classes after vi.mock is executed
    const three = require('three');
    Vector3 = three.Vector3;
  });

  describe('createStraight', () => {
    it('should create a straight road segment with default values', () => {
      const position = new Vector3(0, 0, 0);
      const segment = RoadSegmentFactory.createStraight({
        position: position as unknown as ThreeVector3,
      });

      expect(segment.type).toBe('straight');
      expect(segment.width).toBe(7);
      expect(segment.pavementWidth).toBe(1.5);
      expect(segment.lanes).toBe(2);
      expect(segment.hasCrosswalk).toBe(false);

      // Check connections
      expect(segment.connections.start.position.z).toBe(-3.5); // Half width back
      expect(segment.connections.end.position.z).toBe(3.5); // Half width forward
    });

    it('should create a straight road segment with custom values', () => {
      const position = new Vector3(10, 0, 20);
      const segment = RoadSegmentFactory.createStraight({
        position: position as unknown as ThreeVector3,
        width: 10,
        pavementWidth: 3,
        lanes: 4,
        hasCrosswalk: true,
      });

      expect(segment.type).toBe('straight');
      expect(segment.position.x).toBe(10);
      expect(segment.position.y).toBe(0);
      expect(segment.position.z).toBe(20);

      expect(segment.width).toBe(10);
      expect(segment.pavementWidth).toBe(3);
      expect(segment.lanes).toBe(4);
      expect(segment.hasCrosswalk).toBe(true);

      // Check connections
      expect(segment.connections.start.position.z).toBe(position.z - 5); // Half width back
      expect(segment.connections.end.position.z).toBe(position.z + 5); // Half width forward
    });
  });

  describe('createIntersection', () => {
    it('should create an intersection with default values', () => {
      const segment = RoadSegmentFactory.createIntersection({
        position: new Vector3(0, 0, 0) as unknown as ThreeVector3,
      });

      expect(segment.type).toBe('intersection');
      expect(segment.width).toBe(7);
      expect(segment.length).toBe(7); // Same as width for square segments

      // Check connections (all should be half width from center)
      expect(segment.connections.north.position.z).toBe(-3.5);
      expect(segment.connections.south.position.z).toBe(3.5);
      expect(segment.connections.east.position.x).toBe(3.5);
      expect(segment.connections.west.position.x).toBe(-3.5);
    });
  });

  describe('getConnection', () => {
    it('should return a connection by its key', () => {
      const segment = RoadSegmentFactory.createStraight({
        position: new Vector3(0, 0, 0) as unknown as ThreeVector3,
      });

      const startConnection = RoadSegmentFactory.getConnection(
        segment,
        'start'
      );
      expect(startConnection).toBeTruthy();
      if (startConnection) {
        expect(startConnection.position.z).toBe(-3.5);
      }

      const endConnection = RoadSegmentFactory.getConnection(segment, 'end');
      expect(endConnection).toBeTruthy();
      if (endConnection) {
        expect(endConnection.position.z).toBe(3.5);
      }
    });
  });

  describe('connectSegments', () => {
    it('should connect two segments', () => {
      const segment1 = RoadSegmentFactory.createStraight({
        position: new Vector3(0, 0, 0) as unknown as ThreeVector3,
      });

      const segment2 = RoadSegmentFactory.createStraight({
        position: new Vector3(0, 0, 10) as unknown as ThreeVector3,
      });

      const result = RoadSegmentFactory.connectSegments(
        segment1,
        'end',
        segment2,
        'start'
      );

      expect(result).toBe(true);
      // Verify segment2 was moved to connect with segment1
      expect(segment2.position.z).toBeCloseTo(7); // First segment end (3.5) + second segment start (3.5) = 7
    });

    it('should return false if connection points do not exist', () => {
      const segment1 = RoadSegmentFactory.createStraight({
        position: new Vector3(0, 0, 0) as unknown as ThreeVector3,
      });

      const segment2 = RoadSegmentFactory.createStraight({
        position: new Vector3(0, 0, 10) as unknown as ThreeVector3,
      });

      // Attempt to connect with non-existent connection points
      const result = RoadSegmentFactory.connectSegments(
        segment1,
        'nonexistent',
        segment2,
        'start'
      );

      expect(result).toBe(false);
    });
  });
});
