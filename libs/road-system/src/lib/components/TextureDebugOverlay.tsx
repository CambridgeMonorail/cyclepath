import { useRef, useState, useEffect } from 'react';
import { RoadTextureLoader } from '../utils/road-texture.utils';
import { createPortal } from 'react-dom';

type TextureDebugOverlayProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * A utility component for debugging texture loading issues
 * This provides a UI overlay with texture debugging tools
 */
export const TextureDebugOverlay = ({
  visible,
  onClose,
}: TextureDebugOverlayProps) => {
  const [textureInfo, setTextureInfo] = useState<string>('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );

  // Create a DOM element for the portal
  useEffect(() => {
    // Only create the portal container once
    if (!portalContainer) {
      const container = document.createElement('div');
      container.id = 'texture-debug-portal';
      document.body.appendChild(container);
      setPortalContainer(container);

      // Clean up on unmount
      return () => {
        document.body.removeChild(container);
      };
    }
    return undefined;
  }, [portalContainer]);

  useEffect(() => {
    if (visible) {
      // When the overlay becomes visible, gather texture cache information
      const cacheInfo = gatherTextureCacheInfo();
      setTextureInfo(cacheInfo);
    }
  }, [visible]);

  // Function to gather detailed information about the texture cache
  const gatherTextureCacheInfo = (): string => {
    // Use the debugCache method to log to console
    RoadTextureLoader.debugCache?.();

    try {
      // Access the private texture cache via a workaround (only for debugging)
      const loader = RoadTextureLoader as any;
      const cache = loader.textureCache || {};
      const paths = loader.texturePaths || {};

      // Format the cache information
      let info = '=== Texture Cache Information ===\n\n';
      info += `Total cached textures: ${Object.keys(cache).length}\n\n`;

      // List each texture in the cache with its details
      Object.entries(cache).forEach(([key, texture]: [string, any]) => {
        info += `Texture: ${key}\n`;
        info += `- Has image: ${!!texture.image}\n`;

        if (texture.image) {
          const dimensions =
            texture.image.width && texture.image.height
              ? `${texture.image.width}x${texture.image.height}`
              : 'unknown dimensions';
          info += `- Image: ${dimensions}\n`;

          // Detect if it's a fallback texture by checking for canvas
          const isFallback = texture.image instanceof HTMLCanvasElement;
          info += `- Type: ${
            isFallback ? 'FALLBACK (canvas)' : 'Regular texture'
          }\n`;
        }

        info += `- Successful path: ${paths[key] || 'none recorded'}\n\n`;
      });

      // Add info about the BASE_URL setting
      info += `\nEnvironment Settings:\n`;
      info += `- BASE_URL: ${import.meta.env.BASE_URL || '/'}\n`;
      info += `- Mode: ${import.meta.env.MODE || 'unknown'}\n`;

      return info;
    } catch (error) {
      return `Error gathering texture information: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  };

  // Handler for the "Clear Texture Cache" button
  const handleClearCache = () => {
    RoadTextureLoader.clearCache?.();
    setTextureInfo('Cache cleared. Reload the page to see the effect.');
  };

  // Handler for copying debug info to clipboard
  const handleCopyToClipboard = () => {
    if (textureInfo) {
      navigator.clipboard
        .writeText(textureInfo)
        .then(() => alert('Debug info copied to clipboard!'))
        .catch((err) => console.error('Failed to copy:', err));
    }
  };

  // Don't try to render anything if not visible or no portal container
  if (!visible || !portalContainer) return null;

  // Render the overlay into a portal outside the Canvas
  return createPortal(
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '80%',
        height: '80%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <h2 style={{ margin: 0 }}>Texture Debugging</h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <button
          onClick={handleClearCache}
          style={{
            background: '#ff4444',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Clear Texture Cache
        </button>

        <button
          onClick={handleCopyToClipboard}
          style={{
            background: '#4444ff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Copy to Clipboard
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '10px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          fontSize: '14px',
        }}
      >
        {textureInfo || 'Loading texture information...'}
      </div>
    </div>,
    portalContainer
  );
};

export default TextureDebugOverlay;
