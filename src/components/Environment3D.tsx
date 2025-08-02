import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EnvironmentProps {
  speed: number;
}

export const Environment3D: React.FC<EnvironmentProps> = ({ speed }) => {
  const treesRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Group>(null);
  const buildingsRef = useRef<THREE.Group>(null);

  // Materials
  const treeMaterial = useMemo(() => new THREE.MeshPhongMaterial({ color: 0x228b22 }), []);
  const trunkMaterial = useMemo(() => new THREE.MeshPhongMaterial({ color: 0x8b4513 }), []);
  const cloudMaterial = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.8 
  }), []);
  const buildingMaterial = useMemo(() => new THREE.MeshPhongMaterial({ color: 0x444444 }), []);

  // Animate environment
  useFrame((state, delta) => {
    // Move trees
    if (treesRef.current) {
      treesRef.current.position.z += speed * delta * 2;
      if (treesRef.current.position.z > 20) {
        treesRef.current.position.z = -50;
      }
    }

    // Move clouds slowly
    if (cloudsRef.current) {
      cloudsRef.current.position.z += speed * delta * 0.5;
      if (cloudsRef.current.position.z > 30) {
        cloudsRef.current.position.z = -80;
      }
    }

    // Move buildings
    if (buildingsRef.current) {
      buildingsRef.current.position.z += speed * delta * 1.5;
      if (buildingsRef.current.position.z > 25) {
        buildingsRef.current.position.z = -60;
      }
    }
  });

  return (
    <group>
      {/* Trees */}
      <group ref={treesRef}>
        {Array.from({ length: 30 }, (_, i) => {
          const x = (Math.random() - 0.5) * 40 + (Math.random() > 0.5 ? 15 : -15);
          const z = i * 3 - 45;
          const height = 2 + Math.random() * 3;
          
          return (
            <group key={`tree-${i}`} position={[x, height / 2 - 0.5, z]}>
              {/* Trunk */}
              <mesh position={[0, -height / 2 + 0.3, 0]}>
                <cylinderGeometry args={[0.1, 0.15, 0.8, 6]} />
                <primitive object={trunkMaterial} />
              </mesh>
              {/* Leaves */}
              <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.8, 8, 6]} />
                <primitive object={treeMaterial} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Buildings in the distance */}
      <group ref={buildingsRef}>
        {Array.from({ length: 15 }, (_, i) => {
          const x = (Math.random() - 0.5) * 60 + (Math.random() > 0.5 ? 25 : -25);
          const z = i * 8 - 60;
          const height = 5 + Math.random() * 10;
          
          return (
            <mesh key={`building-${i}`} position={[x, height / 2 - 0.5, z]}>
              <boxGeometry args={[2 + Math.random() * 2, height, 2 + Math.random() * 2]} />
              <primitive object={buildingMaterial} />
            </mesh>
          );
        })}
      </group>

      {/* Clouds */}
      <group ref={cloudsRef}>
        {Array.from({ length: 8 }, (_, i) => {
          const x = (Math.random() - 0.5) * 80;
          const y = 8 + Math.random() * 5;
          const z = i * 15 - 80;
          
          return (
            <group key={`cloud-${i}`} position={[x, y, z]}>
              <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[2, 8, 6]} />
                <primitive object={cloudMaterial} />
              </mesh>
              <mesh position={[1.5, -0.5, 0]}>
                <sphereGeometry args={[1.5, 8, 6]} />
                <primitive object={cloudMaterial} />
              </mesh>
              <mesh position={[-1.5, -0.5, 0]}>
                <sphereGeometry args={[1.5, 8, 6]} />
                <primitive object={cloudMaterial} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Street lights */}
      {Array.from({ length: 20 }, (_, i) => {
        const x = Math.random() > 0.5 ? 6 : -6;
        const z = i * 5 - 50;
        
        return (
          <group key={`light-${i}`} position={[x, 0, z]}>
            {/* Pole */}
            <mesh position={[0, 2, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 4, 6]} />
              <meshPhongMaterial color={0x666666} />
            </mesh>
            {/* Light */}
            <mesh position={[0, 3.8, 0]}>
              <sphereGeometry args={[0.2, 8, 6]} />
              <meshBasicMaterial color={0xffffaa} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};