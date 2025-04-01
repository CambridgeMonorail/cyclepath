# Road Segment Connection System

## Overview

This document establishes the standards for connecting road segments in the Cyclepath road system. The goal is to provide a clear, consistent system that ensures proper alignment of segments on the XZ plane with Y-axis rotation only.

## Core Principles

1. **Flat Surface Constraint**:
   - All road segments must be placed on a single flat plane (y = 0)
   - No elevation changes or slopes are allowed

2. **Y-Axis Rotation Only**:
   - Road segments can only be rotated around the Y-axis (up/down)
   - No tilting or rolling of segments (no rotation around X or Z axes)

3. **Square-Based Design**:
   - All road segments are fundamentally square in shape with equal width and length
   - Connection points are positioned at the midpoints of each side of the square

4. **Connection Point System**:
   - Each segment has between 1-4 connection points
   - Connection points are defined by two properties:
     - **Position**: The 3D position of the connection point
     - **Direction**: A 2D vector indicating the outward direction

## Standard Connection Implementation

### Connection Types

We use two parallel systems for identifying connection points:

1. **Compass Directions**:
   - `north`: Facing the -Z direction
   - `south`: Facing the +Z direction
   - `east`: Facing the +X direction
   - `west`: Facing the -X direction

2. **Segment-Specific Keys**:
   - `start`: The primary entry point of the segment
   - `end`: The primary exit point of the segment
   - `main`: The primary connection (for complex segments like junctions)
   - `branch`: Secondary or branching connection

### Segment Types and Their Default Connections

1. **Straight Segment**:
   - Two connection points: `start` (equivalent to `north`) and `end` (equivalent to `south`)
   - Default orientation: Aligned along the Z-axis

   ```
   ┌───────┐
   │       │
   │   N   │ ← Connection Point (north/start)
   │       │
   │       │
   │       │
   │   S   │ ← Connection Point (south/end)
   │       │
   └───────┘
   ```

2. **Curve Segment**:
   - Two connection points: `start` (equivalent to `north`) and `end` (equivalent to `east`)
   - Default orientation: Turns from -Z to +X (90° right turn)

   ```
   ┌───────┐
   │       │
   │   N   │ ← Connection Point (north/start)
   │       │
   │   ┌───┘
   │   │
   │   E   │ ← Connection Point (east/end)
   │       │
   └───────┘
   ```

3. **Intersection Segment**:
   - Four connection points: `north`, `south`, `east`, and `west`
   - All four sides of the square are connectable

   ```
   ┌───────┐
   │       │
   │   N   │ ← Connection Point (north)
   │       │
   │W     E│ ← Connection Points (west, east)
   │       │
   │   S   │ ← Connection Point (south)
   │       │
   └───────┘
   ```

4. **Junction Segment** (T-Junction):
   - Three connection points: `main` (equivalent to `north`), `end` (equivalent to `south`), and `branch` (equivalent to `east` or `west`)
   - Default orientation: The branch extends to the right (east)

   ```
   ┌───────┐
   │       │
   │   N   │ ← Connection Point (north/main)
   │       │
   │       │
   │       │
   │   S   │ ← Connection Point (south/end)
   │       │
   └───E───┘ ← Connection Point (east/branch)
   ```

5. **Dead-End Segment**:
   - One connection point: `start` (equivalent to `north`)
   - Only connects on one side

   ```
   ┌───────┐
   │       │
   │   N   │ ← Connection Point (north/start)
   │       │
   │       │
   │       │
   │       │ 
   │       │
   └───────┘
   ```

## Connection Rules

1. **Connection Point Matching**:
   - When connecting two segments, the positions of their connection points must align
   - The directions of the connection points must be opposite (point toward each other)

2. **Rotation Handling**:
   - When a segment is rotated, its connection points rotate with it
   - A 90° rotation clockwise changes north → east, east → south, etc.

   Example: A straight segment rotated 90° will have its:
   - `north`/`start` connection facing `east`
   - `south`/`end` connection facing `west`

3. **Connection Translation Table**:

   | Segment Type | Rotation | north points to | south points to | east points to | west points to |
   |--------------|----------|--------------|--------------|--------------|--------------|
   | Straight | 0° | -Z (start) | +Z (end) | N/A | N/A |
   | Straight | 90° | N/A | N/A | +X (start) | -X (end) |
   | Straight | 180° | +Z (end) | -Z (start) | N/A | N/A |
   | Straight | 270° | N/A | N/A | -X (end) | +X (start) |
   | Curve | 0° | -Z (start) | N/A | +X (end) | N/A |
   | Curve | 90° | N/A | N/A | +X (start) | +Z (end) |
   | Curve | 180° | +Z (start) | N/A | N/A | -X (end) |
   | Curve | 270° | N/A | -Z (end) | N/A | -X (start) |

## Connection API

### Getting Connection Points

To retrieve a connection point from a segment, use the `getConnection` method:

```typescript
// Get a connection point by compass direction
const northConnection = RoadSegmentFactory.getConnection(segment, 'north');

// Get a connection by segment-specific key
const startConnection = RoadSegmentFactory.getConnection(segment, 'start');
```

### Connecting Segments

To connect two segments, use the `connectSegments` method:

```typescript
// Connect segment1's 'south' to segment2's 'north'
RoadSegmentFactory.connectSegments(segment1, 'south', segment2, 'north');

// Connect using segment-specific keys
RoadSegmentFactory.connectSegments(segment1, 'end', segment2, 'start');
```

## Implementation Details

### Connection Point Structure

Each connection point has the following properties:

```typescript
interface RoadConnection {
  position: Vector3;  // 3D position of connection point
  direction: Vector2; // 2D direction vector (XZ plane only)
  width: number;      // Width of the connecting surface
}
```

### Connection Resolution Process

When `connectSegments` is called, the system:

1. Retrieves the connection points from both segments
2. Calculates the rotation needed to align segment2's connection to segment1's
3. Rotates segment2 around the Y-axis by this amount
4. Translates segment2 so the connection points align perfectly
5. Updates all connection points of segment2 to reflect the rotation and translation

## Common Issues and Best Practices

### Issue: Connections Don't Align

**Symptoms**:

- Gaps or overlaps between road segments
- Roads appear disjointed in the scene

**Solutions**:

1. Ensure all segments maintain Y=0 height
2. Verify segments are only rotated around Y-axis
3. Check that you're using consistent connection keys
4. Use debug visualization to confirm connection point positions

### Issue: Incorrect Connection Direction

**Symptoms**:

- Roads connect but don't flow naturally
- Sharp angles or U-turns where there shouldn't be any

**Solutions**:

1. Check you're connecting the correct points (e.g., 'end' to 'start')
2. Verify the rotation values are correct (in radians, not degrees)
3. Ensure connection direction vectors are normalized

### Best Practices

1. **Use Consistent Keys**: When possible, use segment-specific keys ('start', 'end') rather than compass directions as they're more resilient to rotation
2. **Validate Connections**: Always check the return value of `connectSegments` to ensure connections were successful
3. **Debug Visualization**: Enable debug mode during development to visualize connection points
4. **Unit Testing**: Create tests for different connection scenarios to prevent regressions

## Debug Tools

To help visualize and debug connections, the Road System includes:

1. **Debug Visualization**: Toggle with the 'D' key in development mode
   - Connection points are shown as colored spheres
   - Connection directions are shown as arrows
   - Segment boundaries are highlighted

2. **Connection Validation**: Enable with the `validateConnections` option
   - Checks for proper alignment of connected segments
   - Warns about gaps, overlaps, or improper rotations

3. **Console Logging**: In development mode, connection operations are logged:
   - Successful connections
   - Connection failures with detailed reasons
   - Segment rotations and translations

## Road Layout Examples

### Square Layout

```
  N1    N2    N3    N4
W1 ┌────┬────┬────┬────┐ E1
   │    │    │    │    │
   │    │    │    │    │
W2 ├────┼────┼────┼────┤ E2
   │    │    │    │    │
   │    │    │    │    │
W3 ├────┼────┼────┼────┤ E3
   │    │    │    │    │
   │    │    │    │    │
W4 └────┴────┴────┴────┘ E4
  S1    S2    S3    S4
```

To create this layout:

1. Create straight segments for each grid cell
2. Connect adjacent segments using the appropriate connection points
3. For border segments, use different segment types or leave connections open

### Figure-8 Layout

```
    ┌────────────────┐    
    │                │    
┌───┘                └───┐
│                        │
│                        │
└───┐                ┌───┘
    │                │    
    └────────────────┘    
```

To create this layout:

1. Create straight segments for horizontal and vertical sections
2. Create curve segments for the corners
3. Connect adjacent segments in sequence
