import { render } from '@testing-library/react';
import RoadSystem from './road-system';

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
