import { useEffect, useRef } from 'react';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { useThree } from '@react-three/fiber';
import { Scene } from 'three';

export function useCSS2DRenderer() {
  const { gl, camera, size, scene } = useThree();
  const rendererRef = useRef<CSS2DRenderer | null>(null);

  useEffect(() => {
    // Create CSS2DRenderer if it doesn't exist
    if (!rendererRef.current) {
      const renderer = new CSS2DRenderer();
      renderer.setSize(size.width, size.height);
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.top = '0';
      renderer.domElement.style.pointerEvents = 'none';
      gl.domElement.parentNode?.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    }

    // Update renderer size when canvas size changes
    rendererRef.current.setSize(size.width, size.height);

    // Add render loop to update labels
    const renderLabels = () => {
      if (rendererRef.current) {
        rendererRef.current.render(scene as Scene, camera);
      }
      requestAnimationFrame(renderLabels);
    };
    renderLabels();

    // Cleanup
    return () => {
      if (rendererRef.current?.domElement) {
        const parent = gl.domElement.parentNode;
        // Only try to remove the child if it's still a child of the parent
        if (parent && parent.contains(rendererRef.current.domElement)) {
          parent.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [gl, camera, scene, size]);

  return rendererRef.current;
}
