import { render } from '@testing-library/react';
import { vi } from 'vitest';
import RoadSystem from './road-system';

// Mock React Three Fiber and Three.js - critical for CI environment
vi.mock('@react-three/fiber', () => ({
  useThree: vi.fn().mockReturnValue({
    scene: {},
    camera: {},
    gl: {},
  }),
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
}));

vi.mock('three', () => ({
  Vector3: class Vector3Mock {
    x: number;
    y: number;
    z: number;
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  },
  Group: class GroupMock {
    add = vi.fn();
    remove = vi.fn();
  },
}));

describe('RoadSystem', () => {
  it('should render successfully', () => {
    const { baseElement, getByText } = render(<RoadSystem />);
    expect(baseElement).toBeTruthy();
    expect(getByText('Road system ready')).toBeTruthy();
  });

  it('should render children when provided', () => {
    const { getByText } = render(
      <RoadSystem>
        <div>Custom content</div>
      </RoadSystem>
    );
    expect(getByText('Custom content')).toBeTruthy();
  });
});
