// Export types
export * from './lib/types/road.types';

// Export factories
export * from './lib/factories/road-segment.factory';

// Export builders
export * from './lib/builders/road-network.builder';

// Export components
export * from './lib/road-system';
export { RoadNetworkComponent } from './lib/components/RoadNetwork';
export * from './lib/components/RoadSegmentMesh';

// Export utilities
export { RoadTextureLoader } from './lib/utils/road-texture.utils';
export { useWebGLContextHandler } from './lib/utils/webgl-context.utils';
