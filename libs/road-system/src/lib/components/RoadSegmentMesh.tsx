import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { RoadSegment } from '../types/road.types';
import { useRoadTextures } from '../utils/use-road-textures';
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
  // Load textures for this road segment
  const textures = useRoadTextures(segment);

  // Generate geometry based on segment type
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

  // Generate UVs for proper texture mapping if needed
  useEffect(() => {
    if ((segment.type === 'curve' || segment.type === 'junction') && textures.map) {
      // For complex geometries, we need to adjust UVs
      geometry.computeVertexNormals();

      const positions = geometry.attributes.position.array;
      const count = geometry.attributes.position.count;
      const uvs = new Float32Array(count * 2);

      // Calculate bounding box for UV mapping
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;

      if (box) {
        const size = new THREE.Vector3();
        box.getSize(size);

        // Generate new UVs based on position
        for (let i = 0; i < count; i++) {
          const x = positions[i * 3];
          const z = positions[i * 3 + 2];

          // Map position to UV (0-1 range)
          const u = (x - box.min.x) / size.x;
          const v = (z - box.min.z) / size.z;

          uvs[i * 2] = u;
          uvs[i * 2 + 1] = v;
        }

        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      }
    }
  }, [geometry, segment.type, textures.map]);

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
        color={textures.map ? "#ffffff" : "#333333"}
        map={textures.map}
        normalMap={textures.normalMap}
        roughnessMap={textures.roughnessMap}
        roughness={0.8}
        metalness={0.2}
        side={THREE.DoubleSide}
      />

      {/* Add road markings if texture is available */}
      {textures.markingsMap && (
        <mesh position={[0, 0.01, 0]}>
          <primitive object={geometry} attach="geometry" />
          <meshStandardMaterial
            transparent={true}
            map={textures.markingsMap}
            alphaTest={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </mesh>
  );
};
