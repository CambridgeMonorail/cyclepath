import { useEffect, useState } from 'react';

type TextureDebugInfo = {
  key: string;
  hasImage: boolean;
  dimensions?: string;
  type: 'fallback' | 'texture';
  path?: string;
};

/**
 * Props for the StandaloneTextureDebugger component
 * Since this component doesn't currently require any props but
 * might be extended in the future, we use Record<string, never>
 * which is the recommended TypeScript idiom for "empty object"
 */
type DebuggerProps = Record<string, never>;

/**
 * Standalone texture debugger that exists outside the Three.js canvas
 * and listens for the custom event to toggle display
 */
export const StandaloneTextureDebugger = (_props: DebuggerProps) => {
  const [visible, setVisible] = useState(false);
  const [textureInfo, setTextureInfo] = useState<TextureDebugInfo[]>([]);
  const [environmentInfo, setEnvironmentInfo] = useState({
    baseUrl: '',
    mode: '',
  });

  // Listen for the custom event to toggle visibility
  useEffect(() => {
    const handleToggleEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ visible: boolean }>;
      setVisible(customEvent.detail.visible);

      if (customEvent.detail.visible) {
        loadTextureInfo();
      }
    };

    window.addEventListener('cyclepath:toggleTextureDebug', handleToggleEvent);

    return () => {
      window.removeEventListener(
        'cyclepath:toggleTextureDebug',
        handleToggleEvent
      );
    };
  }, []);

  // Function to gather texture cache information
  const loadTextureInfo = async () => {
    try {
      // Access the RoadTextureLoader - this requires dynamic import to avoid
      // directly coupling with Three.js in this component
      const { RoadTextureLoader } = await import('../utils/road-texture.utils');

      // Log debug info to console for developers
      RoadTextureLoader.debugCache?.();

      // Access the private caches for the UI display
      const loader = RoadTextureLoader as any;
      const cache = loader.textureCache || {};
      const paths = loader.texturePaths || {};

      const textureInfoArray: TextureDebugInfo[] = Object.entries(cache).map(
        ([key, texture]: [string, any]) => {
          const hasImage = !!texture.image;
          let dimensions = 'unknown dimensions';

          if (texture.image && texture.image.width && texture.image.height) {
            dimensions = `${texture.image.width}x${texture.image.height}`;
          }

          // Detect fallbacks by checking if the image is a canvas
          const isFallback = texture.image instanceof HTMLCanvasElement;

          return {
            key,
            hasImage,
            dimensions,
            type: isFallback ? 'fallback' : 'texture',
            path: paths[key] || undefined,
          };
        }
      );

      setTextureInfo(textureInfoArray);

      // Get environment info
      setEnvironmentInfo({
        baseUrl: import.meta.env.BASE_URL || '/',
        mode: import.meta.env.MODE || 'unknown',
      });
    } catch (error) {
      console.error('Failed to load texture info:', error);
      setTextureInfo([
        {
          key: 'error',
          hasImage: false,
          type: 'fallback',
          dimensions: 'N/A',
          path: `Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ]);
    }
  };

  // Handler for the "Clear Texture Cache" button
  const handleClearCache = async () => {
    try {
      const { RoadTextureLoader } = await import('../utils/road-texture.utils');
      RoadTextureLoader.clearCache?.();

      setTextureInfo([
        {
          key: 'info',
          hasImage: false,
          type: 'fallback',
          dimensions: 'N/A',
          path: 'Cache cleared. Reload the page to see the effect.',
        },
      ]);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  // Only render if visible
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
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
        fontFamily: 'sans-serif',
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
          onClick={() => setVisible(false)}
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
      </div>

      <div
        style={{
          marginBottom: '10px',
          padding: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0' }}>Environment Settings</h3>
        <div>BASE_URL: {environmentInfo.baseUrl}</div>
        <div>Mode: {environmentInfo.mode}</div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '10px',
          fontFamily: 'monospace',
          fontSize: '14px',
          borderRadius: '4px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>
          Cached Textures: {textureInfo.length}
        </h3>

        {textureInfo.length === 0 ? (
          <div>No textures in cache</div>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {textureInfo.map((info) => (
              <div
                key={info.key}
                style={{
                  backgroundColor:
                    info.type === 'fallback'
                      ? 'rgba(255, 100, 100, 0.2)'
                      : 'rgba(100, 255, 100, 0.1)',
                  padding: '12px',
                  borderRadius: '4px',
                  borderLeft:
                    info.type === 'fallback'
                      ? '4px solid #ff4444'
                      : '4px solid #44ff44',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  {info.key}
                </div>
                <div>Has image: {info.hasImage ? 'Yes' : 'No'}</div>
                {info.dimensions && <div>Dimensions: {info.dimensions}</div>}
                <div>
                  Type:{' '}
                  {info.type === 'fallback'
                    ? 'FALLBACK (canvas)'
                    : 'Regular texture'}
                </div>
                {info.path && (
                  <div
                    style={{
                      wordBreak: 'break-all',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '4px',
                      marginTop: '4px',
                    }}
                  >
                    Path: {info.path}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StandaloneTextureDebugger;
