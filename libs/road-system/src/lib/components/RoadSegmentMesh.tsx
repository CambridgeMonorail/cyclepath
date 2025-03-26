import { useMemo } from 'react';
import * as THREE from 'three';
import { RoadSegment } from '../types/road.types';
import { extend } from '@react-three/fiber';

// Extend THREE elements to JSX
extend({
  Mesh: THREE.Mesh,
  MeshStandardMaterial: THREE.MeshStandardMaterial
});

type RoadSegmentMeshProps = {
  segment: RoadSegment;
};

export const RoadSegmentMesh = ({ segment }: RoadSegmentMeshProps) => {
  const geometry = useMemo(() => {
    switch (segment.type) {
      case 'straight':
        return new THREE.PlaneGeometry(segment.width, segment.length);
      case 'curve': {
        const curve = new THREE.EllipseCurve(
          0, 0,
          segment.radius, segment.radius,
          0, segment.angle,
          false,
          0
        );
        const points = curve.getPoints(50);
        const shape = new THREE.Shape();
        shape.moveTo(-segment.width / 2, 0);
        shape.lineTo(segment.width / 2, 0);
        const geometry = new THREE.ExtrudeGeometry(shape, {
          steps: 50,
          bevelEnabled: false,
          extrudePath: new THREE.CatmullRomCurve3(
            points.map(p => new THREE.Vector3(p.x, 0, p.y))
          )
        });
        return geometry;
      }
      case 'intersection':
        return new THREE.PlaneGeometry(segment.width, segment.width);
      case 'junction': {
        const shape = new THREE.Shape();
        const hw = segment.width / 2;
        const hl = segment.length / 2;
        shape.moveTo(-hw, -hl);
        shape.lineTo(hw, -hl);
        shape.lineTo(hw, hl);
        shape.lineTo(-hw, hl);
        if (segment.branchDirection === 'right') {
          shape.moveTo(hw, -hw);
          shape.lineTo(hw + segment.width, -hw);
          shape.lineTo(hw + segment.width, hw);
          shape.lineTo(hw, hw);
        } else {
          shape.moveTo(-hw, -hw);
          shape.lineTo(-hw - segment.width, -hw);
          shape.lineTo(-hw - segment.width, hw);
          shape.lineTo(-hw, hw);
        }
        return new THREE.ShapeGeometry(shape);
      }
      default:
        return new THREE.PlaneGeometry(1, 1);
    }
  }, [segment]);

  return (
    <mesh
      position={[segment.position.x, segment.position.y, segment.position.z]}
      rotation={[
        -Math.PI / 2,
        segment.rotation.y,
        segment.rotation.z
      ]}
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial
        color="#333333"
        roughness={0.8}
        metalness={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
