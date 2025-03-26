import { useEffect, useMemo } from 'react';
import { RoadNetwork as RoadNetworkType } from '../types/road.types';
import { RoadSegmentMesh } from './RoadSegmentMesh';
import { Group } from 'three';
import { extend } from '@react-three/fiber';

extend({ Group });

type RoadNetworkComponentProps = {
  network: RoadNetworkType;
  onLoad?: () => void;
};

export const RoadNetworkComponent = ({ network, onLoad }: RoadNetworkComponentProps) => {
  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  const segments = useMemo(() => network.segments, [network.segments]);

  return (
    <group>
      {segments.map((segment) => (
        <RoadSegmentMesh key={segment.id} segment={segment} />
      ))}
    </group>
  );
};
