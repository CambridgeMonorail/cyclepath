# @cyclepath/road-system

This library provides utilities and components for managing and rendering the road system in the CyclePath game. It includes tools for generating road networks, defining road segments, and integrating the road system into the React Three Fiber 3D scene.

## Features

- **Road Network Builder**: Create procedural road networks with a fluent API
- **Road Segment Factory**: Generate typed road segments (straight, curves, intersections, junctions)
- **React Three Fiber Components**: Ready-to-use 3D components for road visualization
- **Texture Management**: Custom texture loading and generation for road surfaces and markings
- **WebGL Support**: Utilities for handling WebGL context and compatibility
- **Strongly Typed**: Full TypeScript support with comprehensive road type definitions

## Installation

This library is part of the CyclePath Nx monorepo and is already included as a dependency. No additional installation steps are required.

## Usage

### Importing Components and Utilities

```typescript
// Import main components
import { RoadNetworkComponent, RoadSegmentMesh } from '@cyclepath/road-system';

// Import factories and builders
import { RoadSegmentFactory, RoadNetworkBuilder } from '@cyclepath/road-system';

// Import types
import { RoadSegment, RoadNetwork, RoadSegmentType } from '@cyclepath/road-system;

// Import utilities
import { RoadTextureLoader, useWebGLContextHandler } from '@cyclepath/road-system';
```

### Creating a Road Network

Example using the RoadNetworkBuilder:

```typescript
import { RoadNetworkBuilder } from '@cyclepath/road-system;

// Use the builder pattern to create a road network
const roadNetwork = new RoadNetworkBuilder()
  .setStartPoint(new Vector3(0, 0, 0))
  .addSegment(RoadSegmentFactory.createStraight({ length: 20 }))
  .addSegment(RoadSegmentFactory.createCurve({ radius: 15, angle: Math.PI / 6 }))
  .addCheckpoint(new Vector3(20, 0, 30))
  .build();

// Or use the pre-defined test network
const testNetwork = RoadNetworkBuilder.createTestNetwork();
```

### Creating Individual Road Segments

```typescript
import { RoadSegmentFactory } from '@cyclepath/road-system';
import { Vector3 } from 'three';

// Create a straight road segment
const straightRoad = RoadSegmentFactory.createStraight({
  position: new Vector3(0, 0, 0),
  length: 20,
  width: 7,
  lanes: 2
});

// Create a curved road segment
const curvedRoad = RoadSegmentFactory.createCurve({
  position: straightRoad.connections.end.position,
  radius: 15,
  angle: Math.PI / 4, // 45 degrees
  direction: 'right'
});

// Create an intersection
const intersection = RoadSegmentFactory.createIntersection({
  position: new Vector3(20, 0, 20),
  width: 10,
  hasCrosswalk: true
});

// Create a T-junction
const junction = RoadSegmentFactory.createJunction({
  position: new Vector3(40, 0, 0),
  branchDirection: 'left',
  hasCrosswalk: true
});

// Connect segments together
RoadSegmentFactory.connectSegments(straightRoad, 'end', curvedRoad, 'start');
```

### Rendering a Road Network

```tsx
import { Canvas } from '@react-three/fiber';
import { RoadNetworkComponent } from '@cyclepath/road-system';
import { RoadNetworkBuilder } from '@cyclepath/road-system';

const MyRoadScene = () => {
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

## Testing

Run `nx test road-system` to execute the unit tests via Vitest.

## Available Components and Utilities

- **RoadSystem**: Base component for the road system
- **RoadNetworkComponent**: Component for rendering a complete road network
- **RoadSegmentMesh**: React Three Fiber component for rendering individual road segments
- **RoadTextureLoader**: Utility for loading and preparing road textures
- **useRoadTextures**: Hook for generating textures for a road segment
- **useWebGLContextHandler**: Hook for managing WebGL context and errors

## Folder Structure

- **builders/**: RoadNetworkBuilder for creating complete road networks
- **factories/**: RoadSegmentFactory for creating road segments
- **components/**: React components for rendering roads in 3D
- **types/**: TypeScript type definitions for road elements
- **utils/**: Utility functions for textures, WebGL context, etc.

## Integration with the Game Scene

1. Import the RoadNetworkComponent in your game scene
2. Create or load a road network using RoadNetworkBuilder
3. Add the RoadNetworkComponent to your React Three Fiber scene
4. Configure camera to properly view the roads
5. Implement player movement logic based on road positions

For additional implementation details, see the [GameScene](../../apps/cyclepath/src/app/components/GameScene.tsx) component.
