# @cyclepath/road-system

This library provides utilities and components for managing and rendering the road system in the CyclePath game. It includes tools for generating road networks, defining road segments, and integrating the road system into the game scene.

## Features

- **Road Network Generation**: Create procedural road networks with support for straight segments, curves, intersections, and more.
- **Road Segment Factories**: Define and generate road segments with customizable properties such as width, curvature, and connections.
- **Types and Interfaces**: Strictly typed definitions for road-related data structures, ensuring type safety and maintainability.
- **Performance Optimizations**: Includes utilities for chunk-based loading, level of detail (LOD) management, and object pooling.

## Installation

This library is part of the CyclePath Nx monorepo and is already included as a dependency. To use it, simply import the required modules in your application or other libraries.

## Usage

### Importing the Library

To use the road system in your application, import the necessary modules or components:

```typescript
import { generateRoadNetwork } from '@cyclepath/road-system/lib/builders/road-network.builder';
import { createRoadSegment } from '@cyclepath/road-system/lib/factories/road-segment.factory';
import { RoadSegment } from '@cyclepath/road-system/lib/types/road.types';
```

### Example: Generating a Road Network

Here is an example of how to generate a simple road network:

```typescript
import { generateRoadNetwork } from '@cyclepath/road-system/lib/builders/road-network.builder';

const roadNetwork = generateRoadNetwork({
  segments: [
    { type: 'straight', length: 100 },
    { type: 'curve', radius: 50, angle: 90 },
  ],
});

console.log(roadNetwork);
```

### Example: Creating a Road Segment

You can create individual road segments using the factory functions:

```typescript
import { createRoadSegment } from '@cyclepath/road-system/lib/factories/road-segment.factory';

const roadSegment = createRoadSegment({
  type: 'intersection',
  width: 10,
  connections: ['north', 'south', 'east', 'west'],
});

console.log(roadSegment);
```

## Testing

Run `nx test @cyclepath/road-system` to execute the unit tests via [Vitest](https://vitest.dev/).

## Contributing

If you want to contribute to this library, ensure that your changes adhere to the project's coding standards and are thoroughly tested. Place new features or fixes in the appropriate folder structure (e.g., `builders/`, `factories/`, `types/`).

## Folder Structure

- **builders/**: Contains utilities for generating road networks and related structures.
- **factories/**: Includes factory functions for creating road segments and other components.
- **types/**: Defines TypeScript types and interfaces for road-related data structures.

## Integration with the Game Scene

To integrate the road system into the game scene:

1. Replace the placeholder grid with the generated road network.
2. Update the camera system to follow road curves.
3. Implement player movement constraints to stay on roads.
4. Add visual indicators for valid paths.

Refer to the [implementation plan](../../docs/implementation%20plan.md) for detailed steps on integrating the road system.
