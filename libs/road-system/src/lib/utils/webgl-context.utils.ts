import { useEffect, useRef } from 'react';
import { WebGLRenderer, Vector2 } from 'three';

// Define the WebGLContextEvent interface since it's not included in standard TypeScript types
interface WebGLContextEvent extends Event {
  statusMessage: string;
}

/**
 * Custom hook to handle WebGL context loss gracefully
 * @returns Object containing the context loss handler methods
 */
export const useWebGLContextHandler = () => {
  const rendererRef = useRef<WebGLRenderer | null>(null);

  // Setup context loss handling
  useEffect(() => {
    const handleContextLost = (event: Event) => {
      (event as WebGLContextEvent).preventDefault?.();
      console.warn('WebGL context lost. Attempting to restore...');

      // Attempt to restore context after a brief delay
      setTimeout(() => {
        if (rendererRef.current) {
          try {
            // Force renderer to check if context is restored
            rendererRef.current.setAnimationLoop(null);
            rendererRef.current.setAnimationLoop(() => {
              if (rendererRef.current) {
                rendererRef.current.setAnimationLoop(null);
                console.log('WebGL context restored successfully');
              }
            });
          } catch (error) {
            console.error('Failed to restore WebGL context:', error);
          }
        }
      }, 500);
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored');

      // Reload textures or perform other recovery operations here
      if (rendererRef.current) {
        // Force a scene refresh
        const target = new Vector2();
        rendererRef.current.getSize(target);
        rendererRef.current.setSize(target.width, target.height, false);
      }
    };

    return () => {
      // Cleanup event listeners if needed
      if (rendererRef.current?.domElement) {
        rendererRef.current.domElement.removeEventListener('webglcontextlost', handleContextLost);
        rendererRef.current.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      }
    };
  }, []);

  /**
   * Register a WebGL renderer to handle context loss
   * @param renderer The Three.js WebGLRenderer instance
   */
  const registerRenderer = (renderer: WebGLRenderer) => {
    if (!renderer) return;

    rendererRef.current = renderer;

    // Add event listeners for context loss/restore
    renderer.domElement.addEventListener('webglcontextlost', (event: Event) => {
      (event as WebGLContextEvent).preventDefault?.();
      console.warn('WebGL context lost. Attempting to restore...');
    }, false);

    renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
    }, false);
  };

  return {
    registerRenderer,
    renderer: rendererRef.current
  };
};
