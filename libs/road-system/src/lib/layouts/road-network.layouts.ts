import { Vector3 } from 'three';
import {
  ConnectionKey,
  CreateRoadSegmentOptions,
} from '../factories/road-segment.factory';

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
    type: 'straight' | 'curve' | 'intersection' | 'junction' | 'dead-end';
    params: Partial<CreateRoadSegmentOptions>;
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
 *
 * UPDATED FOR SQUARE-BASED ROAD SEGMENTS:
 * All road segments are now square with the same width and length.
 * Connections are defined using compass points (north, south, east, west).
 * Each segment is positioned so the connections align properly.
 */
export const RoadNetworkLayouts = {
  /**
   * Creates a layout definition for a square track with 90-degree curved corners
   * Each side of the square consists of multiple straight segments
   *
   * @param sideLength Length of each side of the square
   * @param roadWidth Width of the road segments
   */
  square(sideLength = 80, roadWidth = 7): RoadNetworkLayout {
    // Calculate how many road segments we need per side
    // Each segment has width = roadWidth, so we need sideLength / roadWidth segments
    const segmentsPerSide = Math.max(
      2,
      Math.floor((sideLength - 2 * roadWidth) / roadWidth)
    );
    const actualSideLength = segmentsPerSide * roadWidth + roadWidth; // Add one for the corner

    console.group('Creating square track layout');
    console.log(`Side length: ${sideLength}, Road width: ${roadWidth}`);
    console.log(
      `Segments per side: ${segmentsPerSide}, Actual side length: ${actualSideLength}`
    );

    const segments: Array<{
      type: 'straight' | 'curve' | 'intersection' | 'junction' | 'dead-end';
      params: Partial<CreateRoadSegmentOptions>;
    }> = [];

    const connections: RoadNetworkConnection[] = [];

    // Calculate positions of all segments first for better organization
    const segmentPositions: Vector3[][] = [];
    const cornerPositions: Vector3[] = [];

    // Function to calculate positions on the square perimeter
    const calculatePositions = () => {
      const halfSide = actualSideLength / 2;

      // Calculate the positions for straight segments
      for (let side = 0; side < 4; side++) {
        const sidePositions: Vector3[] = [];

        for (let i = 0; i < segmentsPerSide; i++) {
          let position: Vector3;

          switch (side) {
            case 0: // Bottom side (west to east)
              position = new Vector3(
                -halfSide + roadWidth / 2 + i * roadWidth,
                0,
                -halfSide + roadWidth / 2
              );
              break;
            case 1: // Right side (bottom to top)
              position = new Vector3(
                halfSide - roadWidth / 2,
                0,
                -halfSide + roadWidth / 2 + i * roadWidth
              );
              break;
            case 2: // Top side (east to west)
              position = new Vector3(
                halfSide - roadWidth / 2 - i * roadWidth,
                0,
                halfSide - roadWidth / 2
              );
              break;
            case 3: // Left side (top to bottom)
              position = new Vector3(
                -halfSide + roadWidth / 2,
                0,
                halfSide - roadWidth / 2 - i * roadWidth
              );
              break;
            default:
              position = new Vector3(0, 0, 0);
          }

          sidePositions.push(position);
        }

        segmentPositions.push(sidePositions);

        // Calculate corner position for this side
        let cornerPos: Vector3;

        switch (side) {
          case 0: // Bottom-right corner
            cornerPos = new Vector3(
              halfSide - roadWidth / 2,
              0,
              -halfSide + roadWidth / 2
            );
            break;
          case 1: // Top-right corner
            cornerPos = new Vector3(
              halfSide - roadWidth / 2,
              0,
              halfSide - roadWidth / 2
            );
            break;
          case 2: // Top-left corner
            cornerPos = new Vector3(
              -halfSide + roadWidth / 2,
              0,
              halfSide - roadWidth / 2
            );
            break;
          case 3: // Bottom-left corner
            cornerPos = new Vector3(
              -halfSide + roadWidth / 2,
              0,
              -halfSide + roadWidth / 2
            );
            break;
          default:
            cornerPos = new Vector3(0, 0, 0);
        }

        cornerPositions.push(cornerPos);
      }
    };

    // Calculate all positions
    calculatePositions();

    // Now create straight segments for each side
    for (let side = 0; side < 4; side++) {
      // Calculate segment rotation (always around Y-axis)
      const rotation = (side * Math.PI) / 2; // 0°, 90°, 180°, 270°

      console.group(
        `Creating segments for side ${side} (${
          ['bottom', 'right', 'top', 'left'][side]
        })`
      );

      // Add all straight segments for this side
      for (let i = 0; i < segmentsPerSide; i++) {
        const position = segmentPositions[side][i];

        segments.push({
          type: 'straight',
          params: {
            position,
            rotation,
            width: roadWidth,
          },
        });

        const segmentIndex = side * segmentsPerSide + i;

        console.log(
          `Added straight segment ${segmentIndex}:`,
          `Position: (${position.x.toFixed(2)}, ${position.z.toFixed(2)})`,
          `Rotation: ${((rotation * 180) / Math.PI).toFixed(2)}°`
        );

        // Create connections between adjacent straight segments
        if (i > 0) {
          const prevIndex = segmentIndex - 1;

          connections.push({
            fromIndex: prevIndex,
            fromConnection: 'end',
            toIndex: segmentIndex,
            toConnection: 'start',
          });

          console.log(
            `Connected straight segment ${prevIndex} (end) → ${segmentIndex} (start)`
          );
        }
      }

      // Add the corner after the straight segments
      const cornerIndex = (side + 1) * segmentsPerSide; // Corner index comes after all straights for this side
      const cornerPosition = cornerPositions[side];

      segments.push({
        type: 'curve',
        params: {
          position: cornerPosition,
          rotation,
          width: roadWidth,
        },
      });

      console.log(
        `Added curve segment ${cornerIndex}:`,
        `Position: (${cornerPosition.x.toFixed(2)}, ${cornerPosition.z.toFixed(
          2
        )})`,
        `Rotation: ${((rotation * 180) / Math.PI).toFixed(2)}°`
      );

      // Connect the last straight of this side to this corner
      const lastStraightIndex = side * segmentsPerSide + (segmentsPerSide - 1);

      connections.push({
        fromIndex: lastStraightIndex,
        fromConnection: 'end',
        toIndex: cornerIndex,
        toConnection: 'start',
      });

      console.log(
        `Connected straight segment ${lastStraightIndex} (end) → corner ${cornerIndex} (start)`
      );

      // If not the first side, connect the previous corner to the first straight of this side
      if (side > 0) {
        const firstSegmentOfSideIndex = side * segmentsPerSide;
        const prevCornerIndex = side * segmentsPerSide - 1; // Previous corner is the last segment of previous side

        connections.push({
          fromIndex: prevCornerIndex,
          fromConnection: 'end',
          toIndex: firstSegmentOfSideIndex,
          toConnection: 'start',
        });

        console.log(
          `Connected previous corner ${prevCornerIndex} (end) → first straight of side ${side}: ${firstSegmentOfSideIndex} (start)`
        );
      }

      console.groupEnd();
    }

    // Connect the final corner back to the first segment to complete the loop
    const lastCornerIndex = segments.length - 1;

    connections.push({
      fromIndex: lastCornerIndex,
      fromConnection: 'end',
      toIndex: 0, // First segment of the track
      toConnection: 'start',
    });

    console.log(
      `Completed loop: Connected final corner ${lastCornerIndex} (end) → first segment 0 (start)`
    );

    // Set the start point to just before the first segment
    const firstSegmentPosition = segments[0].params.position as Vector3;
    const startPoint = new Vector3(
      firstSegmentPosition.x - roadWidth,
      0,
      firstSegmentPosition.z
    );

    // Add checkpoints at the midpoints of each side
    const checkpoints = [
      new Vector3(0, 0, -actualSideLength / 2 + roadWidth / 2), // Bottom
      new Vector3(actualSideLength / 2 - roadWidth / 2, 0, 0), // Right
      new Vector3(0, 0, actualSideLength / 2 - roadWidth / 2), // Top
      new Vector3(-actualSideLength / 2 + roadWidth / 2, 0, 0), // Left
    ];

    console.log('Track creation complete');
    console.log(`Total segments: ${segments.length}`);
    console.log(`Total connections: ${connections.length}`);
    console.log(
      `Start point: (${startPoint.x.toFixed(2)}, ${startPoint.y.toFixed(
        2
      )}, ${startPoint.z.toFixed(2)})`
    );
    console.groupEnd(); // End of square track creation group

    return {
      segments,
      connections,
      options: {
        id: 'square-track',
        name: 'Square Track',
        startPoint,
        checkpoints,
      },
    };
  },

  /**
   * Creates a simple test layout with a straight-curve-straight pattern
   * using square-based road segments
   */
  testTrack(roadWidth = 7): RoadNetworkLayout {
    const segments: Array<{
      type: 'straight' | 'curve' | 'intersection' | 'junction' | 'dead-end';
      params: Partial<CreateRoadSegmentOptions>;
    }> = [
      // First straight segment
      {
        type: 'straight',
        params: {
          position: new Vector3(0, 0, 0),
          rotation: 0,
          width: roadWidth,
        },
      },
      // Second straight segment
      {
        type: 'straight',
        params: {
          position: new Vector3(0, 0, roadWidth),
          rotation: 0,
          width: roadWidth,
        },
      },
      // Third straight segment
      {
        type: 'straight',
        params: {
          position: new Vector3(0, 0, roadWidth * 2),
          rotation: 0,
          width: roadWidth,
        },
      },
      // Curve segment (90-degree turn to the right)
      {
        type: 'curve',
        params: {
          position: new Vector3(0, 0, roadWidth * 3),
          rotation: 0, // No rotation - connections at north and east
          width: roadWidth,
        },
      },
      // Straight after the curve
      {
        type: 'straight',
        params: {
          position: new Vector3(roadWidth, 0, roadWidth * 3),
          rotation: Math.PI / 2, // 90 degrees (east)
          width: roadWidth,
        },
      },
      // Another straight segment
      {
        type: 'straight',
        params: {
          position: new Vector3(roadWidth * 2, 0, roadWidth * 3),
          rotation: Math.PI / 2, // 90 degrees (east)
          width: roadWidth,
        },
      },
    ];

    // Create connections with proper compass directions
    // Understanding that:
    // 1. Straight segments by default have north and south connections
    // 2. Curve segments by default have north and east connections
    // 3. When segments are rotated, their physical connection points rotate accordingly
    const connections: RoadNetworkConnection[] = [
      // Connect first straight's south to second straight's north
      {
        fromIndex: 0,
        fromConnection: 'south', // The south connection of the first straight segment
        toIndex: 1,
        toConnection: 'north', // The north connection of the second straight segment
      },
      // Connect second straight's south to third straight's north
      {
        fromIndex: 1,
        fromConnection: 'south',
        toIndex: 2,
        toConnection: 'north',
      },
      // Connect third straight's south to curve's north
      // Note: The curve's default connections are at north and east
      {
        fromIndex: 2,
        fromConnection: 'south',
        toIndex: 3,
        toConnection: 'north', // The curve's first connection is at north
      },
      // Connect curve's east to first east-bound straight's west
      {
        fromIndex: 3,
        fromConnection: 'east', // The curve's second connection is at east
        toIndex: 4,
        toConnection: 'west', // After 90° rotation, this straight has west and east connections
      },
      // Connect first east-bound straight's east to second east-bound straight's west
      {
        fromIndex: 4,
        fromConnection: 'east',
        toIndex: 5,
        toConnection: 'west',
      },
    ];

    return {
      segments,
      connections,
      options: {
        id: 'test-track',
        name: 'Test Track',
        startPoint: new Vector3(0, 0, -roadWidth),
      },
    };
  },

  /**
   * Creates a figure-8 track layout using square-based road segments
   */
  figure8(trackWidth = 80, roadWidth = 7): RoadNetworkLayout {
    const halfWidth = trackWidth / 2;
    const segmentsNeeded = Math.floor(trackWidth / roadWidth);

    const segments: Array<{
      type: 'straight' | 'curve' | 'intersection' | 'junction' | 'dead-end';
      params: Partial<CreateRoadSegmentOptions>;
    }> = [];

    const connections: RoadNetworkConnection[] = [];

    console.group('Creating figure-8 track layout');
    console.log(`Track width: ${trackWidth}, Road width: ${roadWidth}`);
    console.log(`Segments needed: ${segmentsNeeded}`);

    // Create bottom horizontal segment (west to east)
    for (let i = 0; i < segmentsNeeded; i++) {
      segments.push({
        type: 'straight',
        params: {
          position: new Vector3(
            -halfWidth + roadWidth / 2 + i * roadWidth,
            0,
            0
          ),
          rotation: Math.PI / 2, // East direction (rotated 90°)
          width: roadWidth,
        },
      });

      // Connect to previous segment if not the first
      if (i > 0) {
        connections.push({
          fromIndex: i - 1,
          fromConnection: 'east', // After 90° rotation, straight segments connect at east/west
          toIndex: i,
          toConnection: 'west',
        });
      }
    }

    // Create right vertical segments going up
    const rightStartIdx = segments.length;
    for (let i = 0; i < segmentsNeeded / 2; i++) {
      segments.push({
        type: 'straight',
        params: {
          position: new Vector3(
            halfWidth - roadWidth / 2,
            0,
            -halfWidth / 2 + roadWidth / 2 + i * roadWidth
          ),
          rotation: 0, // North direction (no rotation)
          width: roadWidth,
        },
      });

      // Connect to previous segment (horizontal to vertical if first)
      if (i === 0) {
        connections.push({
          fromIndex: rightStartIdx - 1, // Last horizontal
          fromConnection: 'east', // Last horizontal segment's east connection
          toIndex: rightStartIdx,
          toConnection: 'south', // First vertical segment's south connection
        });
      } else {
        connections.push({
          fromIndex: rightStartIdx + i - 1,
          fromConnection: 'north', // Previous vertical's north
          toIndex: rightStartIdx + i,
          toConnection: 'south', // Current vertical's south
        });
      }
    }

    // Create top-right to top-left segments
    const topIdx = segments.length;
    for (let i = 0; i < segmentsNeeded; i++) {
      // Create curves at specific intervals for a more interesting track
      const isCurve = i % 3 === 1;

      // For segments in the top row, use PI rotation (west-facing)
      const segmentRotation = Math.PI; // 180° rotation (west-facing)

      if (isCurve) {
        // When creating curves, be aware of how their connection points rotate
        segments.push({
          type: 'curve',
          params: {
            position: new Vector3(
              halfWidth - roadWidth / 2 - i * roadWidth,
              0,
              halfWidth / 2 - roadWidth / 2
            ),
            rotation: segmentRotation, // Rotation affects which compass directions the connections face
            width: roadWidth,
          },
        });

        console.log(
          `Added curve at top row position ${i} with rotation ${segmentRotation} radians`
        );
      } else {
        segments.push({
          type: 'straight',
          params: {
            position: new Vector3(
              halfWidth - roadWidth / 2 - i * roadWidth,
              0,
              halfWidth / 2 - roadWidth / 2
            ),
            rotation: segmentRotation,
            width: roadWidth,
          },
        });
      }

      // Connect to previous segment
      if (i === 0) {
        // First top segment connects to the last vertical segment
        connections.push({
          fromIndex: topIdx - 1, // Last vertical segment
          fromConnection: 'north', // Top connection of the vertical segment
          toIndex: topIdx, // First top segment
          toConnection: 'south', // When rotated 180°, the north connection becomes south
        });
        console.log(
          `Connected last vertical (${
            topIdx - 1
          }) north → first top segment (${topIdx}) south`
        );
      } else {
        // For a regular straight segment with 180° rotation:
        // - 'north' becomes 'south'
        // - 'south' becomes 'north'
        // - 'east' becomes 'west'
        // - 'west' becomes 'east'

        // Get the appropriate connection points based on segment types
        const prevSegmentType = segments[topIdx + i - 1].type;
        const currentSegmentType = segments[topIdx + i].type;

        let fromConnection: ConnectionKey = 'east';
        let toConnection: ConnectionKey = 'west';

        // With 180° rotation, 'east' becomes 'west' and vice versa
        if (prevSegmentType === 'straight') {
          fromConnection = 'east'; // With 180° rotation, this is physically the right side
        } else if (prevSegmentType === 'curve') {
          // For a curve with 180° rotation, connections would be at south and west
          fromConnection = 'west';
        }

        if (currentSegmentType === 'straight') {
          toConnection = 'west'; // With 180° rotation, this is physically the left side
        } else if (currentSegmentType === 'curve') {
          // For a curve with 180° rotation, connections would be at south and west
          toConnection = 'south';
        }

        connections.push({
          fromIndex: topIdx + i - 1,
          fromConnection,
          toIndex: topIdx + i,
          toConnection,
        });

        console.log(
          `Connected top segment ${topIdx + i - 1} (${fromConnection}) → ${
            topIdx + i
          } (${toConnection})`
        );
      }
    }

    // Create left vertical segments going down
    const leftIdx = segments.length;
    for (let i = 0; i < segmentsNeeded / 2; i++) {
      segments.push({
        type: 'straight',
        params: {
          position: new Vector3(
            -halfWidth + roadWidth / 2,
            0,
            halfWidth / 2 - roadWidth / 2 - i * roadWidth
          ),
          rotation: Math.PI, // 180° rotation (south direction)
          width: roadWidth,
        },
      });

      // Connect to previous segment
      if (i === 0) {
        // First left vertical connects to the last top segment
        const lastTopSegmentType = segments[leftIdx - 1].type;
        let fromConnection: ConnectionKey = 'west';

        // With 180° rotation on the top row, west is physically on the left
        if (lastTopSegmentType === 'curve') {
          // A curve with 180° rotation would have connections at south and west
          fromConnection = 'south';
        }

        connections.push({
          fromIndex: leftIdx - 1, // Last top segment
          fromConnection,
          toIndex: leftIdx, // First left vertical
          toConnection: 'north', // With 180° rotation, the south connection is physically at the top
        });

        console.log(
          `Connected last top segment ${
            leftIdx - 1
          } (${fromConnection}) → first left vertical ${leftIdx} (north)`
        );
      } else {
        connections.push({
          fromIndex: leftIdx + i - 1,
          fromConnection: 'south', // With 180° rotation, this is physically at the bottom
          toIndex: leftIdx + i,
          toConnection: 'north', // With 180° rotation, this is physically at the top
        });

        console.log(
          `Connected left vertical ${leftIdx + i - 1} (south) → ${
            leftIdx + i
          } (north)`
        );
      }
    }

    // Connect the last vertical to the first horizontal to complete the loop
    connections.push({
      fromIndex: segments.length - 1,
      fromConnection: 'south', // With 180° rotation, this is physically at the bottom
      toIndex: 0,
      toConnection: 'west', // With 90° rotation, this is physically at the left
    });

    console.log(
      `Completed loop: Connected final left vertical ${
        segments.length - 1
      } (south) → first bottom segment 0 (west)`
    );

    console.log('Figure-8 track creation complete');
    console.log(`Total segments: ${segments.length}`);
    console.log(`Total connections: ${connections.length}`);

    console.groupEnd(); // End of figure-8 track creation group

    return {
      segments,
      connections,
      options: {
        id: 'figure-8-track',
        name: 'Figure-8 Track',
        startPoint: new Vector3(-halfWidth, 0, 0),
        checkpoints: [
          new Vector3(halfWidth - roadWidth / 2, 0, 0), // Right side
          new Vector3(0, 0, halfWidth / 2 - roadWidth / 2), // Top
          new Vector3(-halfWidth + roadWidth / 2, 0, 0), // Left side
        ],
      },
    };
  },

  /**
   * Creates a simple intersection with four roads meeting at the center
   */
  intersection(roadLength = 21, roadWidth = 7): RoadNetworkLayout {
    const segments: Array<{
      type: 'straight' | 'curve' | 'intersection' | 'junction' | 'dead-end';
      params: Partial<CreateRoadSegmentOptions>;
    }> = [
      // Center intersection
      {
        type: 'intersection',
        params: {
          position: new Vector3(0, 0, 0),
          rotation: 0,
          width: roadWidth,
        },
      },
      // North road
      {
        type: 'straight',
        params: {
          position: new Vector3(0, 0, -roadWidth),
          rotation: 0,
          width: roadWidth,
        },
      },
      // East road
      {
        type: 'straight',
        params: {
          position: new Vector3(roadWidth, 0, 0),
          rotation: Math.PI / 2,
          width: roadWidth,
        },
      },
      // South road
      {
        type: 'straight',
        params: {
          position: new Vector3(0, 0, roadWidth),
          rotation: Math.PI,
          width: roadWidth,
        },
      },
      // West road
      {
        type: 'straight',
        params: {
          position: new Vector3(-roadWidth, 0, 0),
          rotation: -Math.PI / 2,
          width: roadWidth,
        },
      },
      // Optional: Dead end at the end of the north road
      {
        type: 'dead-end',
        params: {
          position: new Vector3(0, 0, -roadWidth * 2),
          rotation: Math.PI, // Rotated 180 degrees so connection faces south
          width: roadWidth,
        },
      },
    ];

    const connections: RoadNetworkConnection[] = [
      // Connect intersection to north road
      {
        fromIndex: 0,
        fromConnection: 'north',
        toIndex: 1,
        toConnection: 'south',
      },
      // Connect intersection to east road
      {
        fromIndex: 0,
        fromConnection: 'east',
        toIndex: 2,
        toConnection: 'west',
      },
      // Connect intersection to south road
      {
        fromIndex: 0,
        fromConnection: 'south',
        toIndex: 3,
        toConnection: 'north',
      },
      // Connect intersection to west road
      {
        fromIndex: 0,
        fromConnection: 'west',
        toIndex: 4,
        toConnection: 'east',
      },
      // Connect north road to dead end
      {
        fromIndex: 1,
        fromConnection: 'north',
        toIndex: 5,
        toConnection: 'north', // This is the only connection on a dead end
      },
    ];

    return {
      segments,
      connections,
      options: {
        id: 'intersection',
        name: 'Simple Intersection',
        startPoint: new Vector3(0, 0, roadWidth * 2),
      },
    };
  },
};
