import { useCallback } from 'react';
import { WebGLRenderer } from 'three';

/**
 * Hook for handling WebGL context loss and restoration with Three.js
 * Provides a lightweight wrapper around Three.js's built-in context handling
 */
export const useWebGLContextHandler = () => {
  /**
   * Registers a Three.js renderer for context loss handling
   * Sets up appropriate event listeners and fallbacks
   */
  const registerRenderer = useCallback((renderer: WebGLRenderer) => {
    if (!renderer) return;

    // Log warning and handle context loss
    const handleContextLost = (event: Event) => {
      event.preventDefault?.();
      console.warn('WebGL context lost. Three.js will handle restoration automatically.');
    };

    // Log success when context is restored
    const handleContextRestored = () => {
      console.log('WebGL context restored successfully');

      // Force renderer to reset internal state
      if (renderer) {
        renderer.resetState();
      }
    };

    // Add event listeners for context management
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Configure renderer for optimal stability
    renderer.shadowMap.autoUpdate = true;

    console.log('Three.js WebGL renderer configured for context handling');

    // Return cleanup function
    return () => {
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, []);

  return { registerRenderer };
};

/**
 * Basic helper to check WebGL support
 * Uses Three.js's built-in capabilities
 */
export const checkWebGLSupport = (): {
  isSupported: boolean;
  message: string;
} => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');

    if (gl) {
      return {
        isSupported: true,
        message: 'WebGL supported'
      };
    }

    return {
      isSupported: false,
      message: 'WebGL not supported in this browser'
    };
  } catch (e) {
    return {
      isSupported: false,
      message: `Error checking WebGL support: ${e}`
    };
  }
};
