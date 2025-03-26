import { ReactNode } from 'react';

type RoadSystemProps = {
  children?: ReactNode;
};

export function RoadSystem({ children }: RoadSystemProps) {
  return (
    <div className="road-system-container">
      {children || <div>Road system ready</div>}
    </div>
  );
}

export default RoadSystem;
