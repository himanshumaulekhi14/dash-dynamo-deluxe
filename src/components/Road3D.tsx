import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface RoadProps {
  speed: number;
}

export const Road3D: React.FC<RoadProps> = ({ speed }) => {
  const roadRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.Group>(null);
  const { scene } = useThree();

  // Road materials
  const roadMaterial = useMemo(() => new THREE.MeshPhongMaterial({ 
    color: 0x333333,
    shininess: 10
  }), []);

  const grassMaterial = useMemo(() => new THREE.MeshPhongMaterial({ 
    color: 0x2d5c3e,
    shininess: 0
  }), []);

  const lineMaterial = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: 0xffffff
  }), []);

  const centerLineMaterial = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: 0xffff00
  }), []);

  // Animate road lines
  useFrame((state, delta) => {
    if (linesRef.current) {
      linesRef.current.position.z += speed * delta * 2;
      if (linesRef.current.position.z > 2) {
        linesRef.current.position.z = -10;
      }
    }
  });

  return (
    <group ref={roadRef}>
      {/* Road surface */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 100]} />
        <primitive object={roadMaterial} />
      </mesh>

      {/* Grass on sides */}
      <mesh position={[10, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 100]} />
        <primitive object={grassMaterial} />
      </mesh>
      <mesh position={[-10, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 100]} />
        <primitive object={grassMaterial} />
      </mesh>

      {/* Animated road lines */}
      <group ref={linesRef}>
        {/* Center line */}
        {Array.from({ length: 20 }, (_, i) => (
          <mesh key={`center-${i}`} position={[0, -0.49, i * 2 - 10]}>
            <boxGeometry args={[0.1, 0.01, 1]} />
            <primitive object={centerLineMaterial} />
          </mesh>
        ))}

        {/* Lane dividers */}
        {[-2, 2].map(x => 
          Array.from({ length: 20 }, (_, i) => (
            <mesh key={`lane-${x}-${i}`} position={[x, -0.49, i * 2 - 10]}>
              <boxGeometry args={[0.05, 0.01, 0.8]} />
              <primitive object={lineMaterial} />
            </mesh>
          ))
        )}

        {/* Road edges */}
        {[-4, 4].map(x => 
          Array.from({ length: 50 }, (_, i) => (
            <mesh key={`edge-${x}-${i}`} position={[x, -0.49, i * 1 - 25]}>
              <boxGeometry args={[0.1, 0.01, 0.5]} />
              <primitive object={lineMaterial} />
            </mesh>
          ))
        )}
      </group>

      {/* Road barriers */}
      {[-5, 5].map(x => (
        <mesh key={`barrier-${x}`} position={[x, -0.2, 0]}>
          <boxGeometry args={[0.2, 0.6, 100]} />
          <meshPhongMaterial color={0xcccccc} />
        </mesh>
      ))}
    </group>
  );
};