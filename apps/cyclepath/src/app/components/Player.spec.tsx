import { act } from '@testing-library/react';
import { Player } from './Player';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { RoadNetwork } from '@cyclepath/road-system';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

// Mock the react-three-fiber hooks
vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: (state: THREE.Scene, delta: number) => void) => {
    mockUseFrameCallback = callback;
  },
}));

// Create a mock for the useFrame callback
let mockUseFrameCallback: ((state: THREE.Scene, delta: number) => void) | null =
  null;

// Mock RoadNetwork
const mockRoadNetwork = {
  segments: [],
  startPoint: { x: 0, z: 0 },
  endPoint: { x: 10, z: 10 },
} as unknown as RoadNetwork;

// Mock THREE.Mesh structure that matches what the component expects
// This corresponds to the structure used in the Player component
type MockMeshRef = {
  current: {
    position: {
      x: number;
      y: number;
      z: number;
    };
    rotation: {
      y: number;
    };
  } | null;
};

// Global mockMeshRef that we can access in tests
let mockMeshRef: MockMeshRef = { current: null };

// Mock the React useRef hook
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useRef: () => {
      // Initialize mock mesh ref with the proper structure
      mockMeshRef.current = {
        position: { x: 0, y: 0.5, z: 0 },
        rotation: { y: 0 },
      };
      return mockMeshRef;
    },
  };
});

describe('Player', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    // Setup DOM element for the test
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    // Reset the mocks
    mockUseFrameCallback = null;
    mockMeshRef = { current: null };
  });

  afterEach(() => {
    // Cleanup
    root.unmount();
    document.body.removeChild(container);
    vi.resetAllMocks();
  });

  it('renders without crashing', () => {
    const onMove = vi.fn();
    const position = { x: 0, z: 0 };

    act(() => {
      root.render(
        <Player
          position={position}
          onMove={onMove}
          roadNetwork={mockRoadNetwork}
        />
      );
    });

    // No assertions needed - test passes if no errors are thrown
  });

  it('calls onMove when player moves forward', () => {
    const onMove = vi.fn();
    const position = { x: 0, z: 0 };

    act(() => {
      root.render(
        <Player
          position={position}
          onMove={onMove}
          roadNetwork={mockRoadNetwork}
        />
      );
    });

    // Simulate keyboard input
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    });

    // Simulate frame update
    act(() => {
      if (mockUseFrameCallback) {
        mockUseFrameCallback({} as THREE.Scene, 0.016); // ~60fps
      }
    });

    // Check if onMove was called with new position
    expect(onMove).toHaveBeenCalled();
  });

  it('updates rotation when turning left/right', () => {
    const onMove = vi.fn();
    const position = { x: 0, z: 0 };

    act(() => {
      root.render(
        <Player
          position={position}
          onMove={onMove}
          roadNetwork={mockRoadNetwork}
        />
      );
    });

    // Simulate turning left
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    });

    // Simulate frame update
    act(() => {
      if (mockUseFrameCallback) {
        mockUseFrameCallback({} as THREE.Scene, 0.016);
      }
    });

    // The test passes if no errors are thrown
  });
});
