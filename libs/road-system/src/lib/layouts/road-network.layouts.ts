import { Vector3 } from 'three';
import { ConnectionKey } from '../factories/road-segment.factory';

/**
 * Defines a connection between road segments in a network layout
 */
export type RoadNetworkConnection = {
  fromIndex: number;
  fromConnection: ConnectionKey;
  toIndex: number;
  toConnection: ConnectionKey;
};

/**
 * Configuration options for a road network layout
 */
export type RoadNetworkLayoutOptions = {
  id?: string;
  name?: string;
  startPoint?: Vector3;
  checkpoints?: Vector3[];
};

/**
 * Defines a road network layout that can be built by the RoadNetworkBuilder
 */
export type RoadNetworkLayout = {
  /**
   * Road segment definitions that should be created
   */
  segments: Array<{
    type: 'straight' | 'curve' | 'intersection' | 'junction';
    params: Record<string, any>;
  }>;

  /**
   * Connections between segments
   */
  connections: RoadNetworkConnection[];

  /**
   * Configuration options for the network
   */
  options: RoadNetworkLayoutOptions;
};

/**
 * Predefined road network layouts
 */
export const RoadNetworkLayouts = {
  /**
   * Creates a layout definition for a square track with 90-degree curved corners
   * Each side of the square consists of two straight segments for more flexibility
   *
   * @param sideLength Length of each side of the square
   * @param cornerRadius Radius of the curved corners
   * @param roadWidth Width of the road segments
   */
  square(sideLength = 80, cornerRadius = 15, roadWidth = 7): RoadNetworkLayout {
    // Each side will have two straight segments, so each straight segment is half the side length
    // minus the corner radius on each end
    const straightLength = (sideLength - cornerRadius * 2) / 2;

    // Define all segments
    const segments = [
      // Bottom side - first straight segment
      {
        type: 'straight' as const,
        params: {
          position: new Vector3(
            -(sideLength / 2 - cornerRadius) + straightLength / 2,
            0,
            -(sideLength / 2)
          ),
          rotation: new Vector3(0, 0, 0),
          length: straightLength,
          width: roadWidth,
        },
      },

      // Bottom side - second straight segment
      {
        type: 'straight' as const,
        params: {
          position: new Vector3(
            sideLength / 2 - cornerRadius - straightLength / 2,
            0,
            -(sideLength / 2)
          ),
          rotation: new Vector3(0, 0, 0),
          length: straightLength,
          width: roadWidth,
        },
      },

      // Bottom-right corner
      {
        type: 'curve' as const,
        params: {
          position: new Vector3(
            sideLength / 2 - cornerRadius,
            0,
            -(sideLength / 2 - cornerRadius)
          ),
          rotation: new Vector3(0, 0, 0),
          radius: cornerRadius,
          angle: Math.PI / 2, // 90-degree turn
          direction: 'right',
          width: roadWidth,
        },
      },

      // Right side - first straight segment
      {
        type: 'straight' as const,
        params: {
          position: new Vector3(
            sideLength / 2,
            0,
            -(sideLength / 2 - cornerRadius) + straightLength / 2
          ),
          rotation: new Vector3(0, Math.PI / 2, 0), // Rotated 90 degrees
          length: straightLength,
          width: roadWidth,
        },
      },

      // Right side - second straight segment
      {
        type: 'straight' as const,
        params: {
          position: new Vector3(
            sideLength / 2,
            0,
            sideLength / 2 - cornerRadius - straightLength / 2
          ),
          rotation: new Vector3(0, Math.PI / 2, 0), // Rotated 90 degrees
          length: straightLength,
          width: roadWidth,
        },
      },

      // Top-right corner
      {
        type: 'curve' as const,
        params: {
          position: new Vector3(
            sideLength / 2 - cornerRadius,
            0,
            sideLength / 2 - cornerRadius
          ),
          rotation: new Vector3(0, Math.PI / 2, 0), // Rotated 90 degrees
          radius: cornerRadius,
          angle: Math.PI / 2, // 90-degree turn
          direction: 'right',
          width: roadWidth,
        },
      },

      // Top side - first straight segment
      {
        type: 'straight' as const,
        params: {
          position: new Vector3(
            sideLength / 2 - cornerRadius - straightLength / 2,
            0,
            sideLength / 2
          ),
          rotation: new Vector3(0, Math.PI, 0), // Rotated 180 degrees
          length: straightLength,
          width: roadWidth,
        },
      },

      // Top side - second straight segment
      {
        type: 'straight' as const,
        params: {
          position: new Vector3(
            -(sideLength / 2 - cornerRadius) + straightLength / 2,
            0,
            sideLength / 2
          ),
          rotation: new Vector3(0, Math.PI, 0), // Rotated 180 degrees
          length: straightLength,
          width: roadWidth,
        },
      },

      // Top-left corner
      {
        type: 'curve' as const,
        params: {
          position: new Vector3(
            -(sideLength / 2 - cornerRadius),
            0,
            sideLength / 2 - cornerRadius
          ),
          rotation: new Vector3(0, Math.PI, 0), // Rotated 180 degrees
          radius: cornerRadius,
          angle: Math.PI / 2, // 90-degree turn
          direction: 'right',
          width: roadWidth,
        },
      },

      // Left side - first straight segment
      {
        type: 'straight' as const,
        params: {
          position: new Vector3(
            -sideLength / 2,
            0,
            sideLength / 2 - cornerRadius - straightLength / 2
          ),
          rotation: new Vector3(0, -Math.PI / 2, 0), // Rotated -90 degrees
          length: straightLength,
          width: roadWidth,
        },
      },

      // Left side - second straight segment
      {
        type: 'straight' as const,
        params: {
          position: new Vector3(
            -sideLength / 2,
            0,
            -(sideLength / 2 - cornerRadius) + straightLength / 2
          ),
          rotation: new Vector3(0, -Math.PI / 2, 0), // Rotated -90 degrees
          length: straightLength,
          width: roadWidth,
        },
      },

      // Bottom-left corner
      {
        type: 'curve' as const,
        params: {
          position: new Vector3(
            -(sideLength / 2 - cornerRadius),
            0,
            -(sideLength / 2 - cornerRadius)
          ),
          rotation: new Vector3(0, -Math.PI / 2, 0), // Rotated -90 degrees
          radius: cornerRadius,
          angle: Math.PI / 2, // 90-degree turn
          direction: 'right',
          width: roadWidth,
        },
      },
    ];

    // Define connections between segments (making a complete loop)
    const connections: RoadNetworkConnection[] = [
      {
        fromIndex: 0,
        fromConnection: 'end',
        toIndex: 1,
        toConnection: 'start',
      }, // Bottom 1 to Bottom 2
      {
        fromIndex: 1,
        fromConnection: 'end',
        toIndex: 2,
        toConnection: 'start',
      }, // Bottom 2 to Bottom-Right Corner
      {
        fromIndex: 2,
        fromConnection: 'end',
        toIndex: 3,
        toConnection: 'start',
      }, // Bottom-Right Corner to Right 1
      {
        fromIndex: 3,
        fromConnection: 'end',
        toIndex: 4,
        toConnection: 'start',
      }, // Right 1 to Right 2
      {
        fromIndex: 4,
        fromConnection: 'end',
        toIndex: 5,
        toConnection: 'start',
      }, // Right 2 to Top-Right Corner
      {
        fromIndex: 5,
        fromConnection: 'end',
        toIndex: 6,
        toConnection: 'start',
      }, // Top-Right Corner to Top 1
      {
        fromIndex: 6,
        fromConnection: 'end',
        toIndex: 7,
        toConnection: 'start',
      }, // Top 1 to Top 2
      {
        fromIndex: 7,
        fromConnection: 'end',
        toIndex: 8,
        toConnection: 'start',
      }, // Top 2 to Top-Left Corner
      {
        fromIndex: 8,
        fromConnection: 'end',
        toIndex: 9,
        toConnection: 'start',
      }, // Top-Left Corner to Left 1
      {
        fromIndex: 9,
        fromConnection: 'end',
        toIndex: 10,
        toConnection: 'start',
      }, // Left 1 to Left 2
      {
        fromIndex: 10,
        fromConnection: 'end',
        toIndex: 11,
        toConnection: 'start',
      }, // Left 2 to Bottom-Left Corner
      {
        fromIndex: 11,
        fromConnection: 'end',
        toIndex: 0,
        toConnection: 'start',
      }, // Bottom-Left Corner to Bottom 1
    ];

    // Set the start point to the beginning of the first segment
    const startSegmentPosition = segments[0].params.position as Vector3;
    const startPoint = new Vector3(
      startSegmentPosition.x - straightLength / 2,
      0,
      startSegmentPosition.z
    );

    // Add a checkpoint at the halfway point of the track (top of the square)
    const checkpointPosition = segments[6].params.position as Vector3;
    const checkpoint = new Vector3(
      checkpointPosition.x,
      0,
      checkpointPosition.z
    );

    return {
      segments,
      connections,
      options: {
        id: 'square-track',
        name: 'Square Track',
        startPoint,
        checkpoints: [checkpoint],
      },
    };
  },

  /**
   * Creates a simple test layout with a straight-curve-straight pattern
   */
  testTrack(): RoadNetworkLayout {
    return {
      segments: [
        {
          type: 'straight',
          params: {
            position: new Vector3(0, 0, 0),
            rotation: new Vector3(0, 0, 0),
            length: 20,
            width: 7,
          },
        },
        {
          type: 'straight',
          params: {
            position: new Vector3(0, 0, 20),
            rotation: new Vector3(0, 0, 0),
            length: 20,
            width: 7,
          },
        },
        {
          type: 'curve',
          params: {
            position: new Vector3(0, 0, 40),
            rotation: new Vector3(0, 0, 0),
            radius: 15,
            angle: Math.PI / 2, // 90-degree turn
            width: 7,
          },
        },
        {
          type: 'straight',
          params: {
            position: new Vector3(15, 0, 55),
            rotation: new Vector3(0, Math.PI / 2, 0),
            length: 25,
            width: 7,
          },
        },
      ],
      connections: [
        {
          fromIndex: 0,
          fromConnection: 'end',
          toIndex: 1,
          toConnection: 'start',
        },
        {
          fromIndex: 1,
          fromConnection: 'end',
          toIndex: 2,
          toConnection: 'start',
        },
        {
          fromIndex: 2,
          fromConnection: 'end',
          toIndex: 3,
          toConnection: 'start',
        },
      ],
      options: {
        id: 'test-track',
        name: 'Test Track',
      },
    };
  },

  /**
   * Creates a figure-8 track layout
   */
  figure8(
    trackWidth = 80,
    cornerRadius = 20,
    roadWidth = 7
  ): RoadNetworkLayout {
    const halfWidth = trackWidth / 2;
    const straightLength = halfWidth - cornerRadius;

    return {
      segments: [
        // Bottom straight segment
        {
          type: 'straight',
          params: {
            position: new Vector3(0, 0, -halfWidth + straightLength / 2),
            rotation: new Vector3(0, 0, 0),
            length: straightLength,
            width: roadWidth,
          },
        },
        // Bottom-right curve
        {
          type: 'curve',
          params: {
            position: new Vector3(cornerRadius, 0, -halfWidth + cornerRadius),
            rotation: new Vector3(0, 0, 0),
            radius: cornerRadius,
            angle: Math.PI / 2,
            direction: 'right',
            width: roadWidth,
          },
        },
        // Right straight segment
        {
          type: 'straight',
          params: {
            position: new Vector3(halfWidth, 0, 0),
            rotation: new Vector3(0, Math.PI / 2, 0),
            length: straightLength * 2,
            width: roadWidth,
          },
        },
        // Top-right curve
        {
          type: 'curve',
          params: {
            position: new Vector3(cornerRadius, 0, halfWidth - cornerRadius),
            rotation: new Vector3(0, Math.PI / 2, 0),
            radius: cornerRadius,
            angle: Math.PI / 2,
            direction: 'right',
            width: roadWidth,
          },
        },
        // Top straight segment
        {
          type: 'straight',
          params: {
            position: new Vector3(0, 0, halfWidth - straightLength / 2),
            rotation: new Vector3(0, Math.PI, 0),
            length: straightLength,
            width: roadWidth,
          },
        },
        // Top-left curve
        {
          type: 'curve',
          params: {
            position: new Vector3(-cornerRadius, 0, halfWidth - cornerRadius),
            rotation: new Vector3(0, Math.PI, 0),
            radius: cornerRadius,
            angle: Math.PI / 2,
            direction: 'right',
            width: roadWidth,
          },
        },
        // Left straight segment
        {
          type: 'straight',
          params: {
            position: new Vector3(-halfWidth, 0, 0),
            rotation: new Vector3(0, -Math.PI / 2, 0),
            length: straightLength * 2,
            width: roadWidth,
          },
        },
        // Bottom-left curve
        {
          type: 'curve',
          params: {
            position: new Vector3(-cornerRadius, 0, -halfWidth + cornerRadius),
            rotation: new Vector3(0, -Math.PI / 2, 0),
            radius: cornerRadius,
            angle: Math.PI / 2,
            direction: 'right',
            width: roadWidth,
          },
        },
      ],
      connections: [
        {
          fromIndex: 0,
          fromConnection: 'end',
          toIndex: 1,
          toConnection: 'start',
        },
        {
          fromIndex: 1,
          fromConnection: 'end',
          toIndex: 2,
          toConnection: 'start',
        },
        {
          fromIndex: 2,
          fromConnection: 'end',
          toIndex: 3,
          toConnection: 'start',
        },
        {
          fromIndex: 3,
          fromConnection: 'end',
          toIndex: 4,
          toConnection: 'start',
        },
        {
          fromIndex: 4,
          fromConnection: 'end',
          toIndex: 5,
          toConnection: 'start',
        },
        {
          fromIndex: 5,
          fromConnection: 'end',
          toIndex: 6,
          toConnection: 'start',
        },
        {
          fromIndex: 6,
          fromConnection: 'end',
          toIndex: 7,
          toConnection: 'start',
        },
        {
          fromIndex: 7,
          fromConnection: 'end',
          toIndex: 0,
          toConnection: 'start',
        },
      ],
      options: {
        id: 'figure-8-track',
        name: 'Figure-8 Track',
        startPoint: new Vector3(0, 0, -halfWidth),
        checkpoints: [
          new Vector3(0, 0, halfWidth),
          new Vector3(-halfWidth, 0, 0),
          new Vector3(halfWidth, 0, 0),
        ],
      },
    };
  },
};
