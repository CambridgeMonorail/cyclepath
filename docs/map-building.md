# Road System Map Building Guide

> Last updated: March 30, 2025

## Overview

The Cyclepath road system provides a flexible way to build road networks using various segment types like straight roads, curves, intersections, and junctions. This document explains how to use the `RoadNetworkBuilder` to construct road networks programmatically with validation to ensure only compatible segments are connected.

## Road Segment Types

The road system includes four primary segment types, each with specific connection points:

### 1. Straight Segments

Straight road segments are the simplest building blocks:

```typescript
const straightRoad = RoadSegmentFactory.createStraight({
  position: new Vector3(0, 0, 0),
  length: 20,
  width: 7,
  lanes: 2,
  hasCrosswalk: false
});
```

**Connection Points**: `start` and `end`

### 2. Curved Segments

Curved segments allow you to create turns with configurable radius and angle:

```typescript
const curvedRoad = RoadSegmentFactory.createCurved({
  position: new Vector3(20, 0, 0),
  radius: 15,
  angle: Math.PI / 2, // 90-degree turn
  direction: 'right',
  width: 7
});
```

**Connection Points**: `start` and `end`

### 3. Intersections

Four-way intersections with connections in all cardinal directions:

```typescript
const intersection = RoadSegmentFactory.createIntersection({
  position: new Vector3(40, 0, 0),
  width: 10,
  hasCrosswalk: true
});
```

**Connection Points**: `north`, `south`, `east`, and `west`

### 4. Junctions (T-junctions)

T-junctions that branch off in one direction:

```typescript
const junction = RoadSegmentFactory.createJunction({
  position: new Vector3(60, 0, 0),
  width: 7,
  branchDirection: 'left'
});
```

**Connection Points**: `main`, `end`, and `branch`

## Using the Road Network Builder

The `RoadNetworkBuilder` provides a flexible, type-safe way to create road networks by connecting segments. It includes validation to ensure that only compatible segments can be connected.

### Basic Builder Pattern

```typescript
import { RoadNetworkBuilder } from '@cyclepath/road-system';
import { Vector3 } from 'three';

// Create a simple road network
const roadNetwork = new RoadNetworkBuilder('Downtown Circuit')
  .setStartPoint(new Vector3(0, 0, 0))
  .addSegment(RoadSegmentFactory.createStraight({
    position: new Vector3(0, 0, 0)
  }))
  .addSegment(RoadSegmentFactory.createCurved({
    position: new Vector3(0, 0, 20),
    angle: Math.PI / 4
  }))
  .connectSegments(0, 'end', 1, 'start')
  .build();
```

### Creating Networks with Multiple Segments

```typescript
// Create segments first
const segment1 = RoadSegmentFactory.createStraight({
  position: new Vector3(0, 0, 0),
  length: 20
});

const segment2 = RoadSegmentFactory.createCurved({
  position: new Vector3(0, 0, 20),
  radius: 15,
  angle: Math.PI / 2 // 90-degree turn
});

const segment3 = RoadSegmentFactory.createStraight({
  position: new Vector3(15, 0, 35),
  rotation: new Vector3(0, Math.PI / 2, 0),
  length: 20
});

// Use the builder to create the network
const roadNetwork = new RoadNetworkBuilder('Circuit Track')
  .addSegments([segment1, segment2, segment3])
  .setStartPoint(segment1.connections.start.position)
  .addCheckpoint(segment3.connections.end.position)
  .connectSegments(0, 'end', 1, 'start')
  .connectSegments(1, 'end', 2, 'start')
  .build();
```

### Simplified Custom Network Creation

For less boilerplate, use the `createCustomNetwork` static method:

```typescript
const roadNetwork = RoadNetworkBuilder.createCustomNetwork(
  [segment1, segment2, segment3],
  [
    { from: 0, fromConnection: 'end', to: 1, toConnection: 'start' },
    { from: 1, fromConnection: 'end', to: 2, toConnection: 'start' }
  ],
  {
    name: 'Custom Circuit',
    startPoint: segment1.connections.start.position,
    checkpoints: [segment3.connections.end.position]
  }
);
```

## Connection Validation

The `RoadNetworkBuilder` performs validation to ensure that:

1. Segment indices are valid when connecting segments
2. Connection keys are appropriate for the segment types
3. A segment cannot connect to itself
4. The network has at least one segment and a start point

## Road Segment Connection Rules

When connecting road segments, follow these rules:

1. Connect the `end` of one segment to the `start` of another when joining straight or curved segments
2. For intersections, use the appropriate cardinal direction: `north`, `south`, `east`, or `west`
3. For junctions, connect to the `main`, `end`, or `branch` points as needed
4. The widths of connected segments should be compatible

## Road Network Properties

A road network consists of:

```typescript
type RoadNetwork = {
  id: string;
  name: string;
  segments: RoadSegment[];
  startPoint: Vector3;
  checkpoints: Vector3[];
};
```

- `id`: Unique identifier
- `name`: Descriptive name
- `segments`: Array of connected road segments
- `startPoint`: Starting position for the player
- `checkpoints`: Optional waypoints the player needs to pass through

## Rendering Road Networks

Once you've built a road network, render it with the `RoadNetworkComponent`:

```tsx
import { RoadNetworkComponent } from '@cyclepath/road-system';

export const GameScene = () => {
  const roadNetwork = RoadNetworkBuilder.createTestNetwork();
  
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <RoadNetworkComponent network={roadNetwork} />
    </Canvas>
  );
};
```

## Example: Creating a Figure-8 Track

Here's how to create a more complex figure-8 track:

```typescript
// Create segments
const straightA = RoadSegmentFactory.createStraight({
  position: new Vector3(0, 0, 0),
  length: 30
});

const curveB = RoadSegmentFactory.createCurved({
  position: new Vector3(0, 0, 30),
  radius: 20,
  angle: Math.PI, // 180-degree turn
  direction: 'right'
});

const straightC = RoadSegmentFactory.createStraight({
  position: new Vector3(40, 0, 30),
  rotation: new Vector3(0, Math.PI, 0),
  length: 30
});

const curveD = RoadSegmentFactory.createCurved({
  position: new Vector3(40, 0, 0),
  rotation: new Vector3(0, Math.PI, 0),
  radius: 20,
  angle: Math.PI, // 180-degree turn
  direction: 'right'
});

// Use the builder to create the network
const figure8Network = new RoadNetworkBuilder('Figure-8 Track')
  .addSegments([straightA, curveB, straightC, curveD])
  .setStartPoint(straightA.connections.start.position)
  .connectSegments(0, 'end', 1, 'start')
  .connectSegments(1, 'end', 2, 'start')
  .connectSegments(2, 'end', 3, 'start')
  .connectSegments(3, 'end', 0, 'start')
  .build();
```

## Debugging Road Networks

When building road networks, enable debug mode to visualize connection points:

```tsx
<RoadNetworkComponent network={roadNetwork} debug={true} />
```

This will display:

- Connection points as colored spheres (green for start, red for end)
- Direction indicators showing segment orientations
- Checkpoints as orange spheres
- The start point as a magenta sphere

## Advanced Techniques

### Predefined Templates

The `RoadNetworkBuilder` includes predefined templates to get started quickly:

```typescript
// Get a test network with a straight-curve-straight pattern
const testNetwork = RoadNetworkBuilder.createTestNetwork();

// Same network but created using the builder pattern
const builderNetwork = RoadNetworkBuilder.createTestNetworkWithBuilder();
```

### Custom Textures

Customize road appearances with texture options:

```typescript
const customRoad = RoadSegmentFactory.createStraight({
  position: new Vector3(0, 0, 0),
  textureOptions: {
    roadTexture: 'custom_asphalt.jpg',
    normalMap: 'custom_normal.png',
    roughnessMap: 'custom_roughness.png',
    repeat: new Vector2(1, 5) // Texture repetition pattern
  }
});
```

## Under the Hood

The road system works through these key components:

1. **RoadSegmentFactory**: Creates individual road segments with proper connection points
2. **RoadNetworkBuilder**: Assembles segments into networks with validation
3. **RoadSegmentMesh**: Renders individual road segments with three.js
4. **RoadNetworkComponent**: Renders the entire road network

Each segment has a position, rotation, and connection points which are used during the building process to ensure proper alignment.

## Next Steps

To create more complex road networks:

1. Experiment with different segment combinations
2. Use intersections and junctions to create branching paths
3. Add checkpoints to create race courses
4. Integrate elevation changes by modifying the y-coordinate of segment positions

The road system is designed to be flexible enough to create everything from simple tracks to complex city layouts.
