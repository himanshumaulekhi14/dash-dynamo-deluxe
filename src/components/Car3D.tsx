import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CarProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  isPlayer?: boolean;
  speed?: number;
}

export const Car3D: React.FC<CarProps> = ({ 
  position, 
  rotation = [0, 0, 0], 
  color = '#ff0000',
  isPlayer = false,
  speed = 0
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const wheelsRef = useRef<THREE.Mesh[]>([]);

  // Create car geometry
  const carGeometry = useMemo(() => {
    const bodyGeometry = new THREE.BoxGeometry(0.8, 0.3, 1.6);
    const roofGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.8);
    const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8);
    
    return { bodyGeometry, roofGeometry, wheelGeometry };
  }, []);

  // Materials
  const carMaterial = useMemo(() => new THREE.MeshPhongMaterial({ 
    color: color,
    shininess: 100,
    specular: 0x222222
  }), [color]);

  const glassMaterial = useMemo(() => new THREE.MeshPhongMaterial({ 
    color: 0x87ceeb,
    transparent: true,
    opacity: 0.3,
    shininess: 200
  }), []);

  const wheelMaterial = useMemo(() => new THREE.MeshPhongMaterial({ 
    color: 0x333333 
  }), []);

  const rimMaterial = useMemo(() => new THREE.MeshPhongMaterial({ 
    color: 0xcccccc,
    shininess: 100,
    specular: 0x444444
  }), []);

  // Animation
  useFrame((state, delta) => {
    if (wheelsRef.current.length > 0 && speed > 0) {
      wheelsRef.current.forEach(wheel => {
        wheel.rotation.x += speed * delta * 2;
      });
    }

    // Player car hover effect
    if (isPlayer && groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }

    // Engine vibration for high speeds
    if (isPlayer && speed > 8 && groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 20) * 0.005;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Car Body */}
      <mesh position={[0, 0, 0]} geometry={carGeometry.bodyGeometry} material={carMaterial} />
      
      {/* Car Roof */}
      <mesh position={[0, 0.25, -0.2]} geometry={carGeometry.roofGeometry} material={carMaterial} />
      
      {/* Windshield */}
      <mesh position={[0, 0.25, 0.2]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.58, 0.18, 0.02]} />
        <primitive object={glassMaterial} />
      </mesh>
      
      {/* Side Windows */}
      <mesh position={[0.29, 0.25, -0.2]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.02, 0.18, 0.6]} />
        <primitive object={glassMaterial} />
      </mesh>
      <mesh position={[-0.29, 0.25, -0.2]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.02, 0.18, 0.6]} />
        <primitive object={glassMaterial} />
      </mesh>

      {/* Wheels */}
      <mesh 
        ref={(el) => { if (el) wheelsRef.current[0] = el; }}
        position={[0.35, -0.2, 0.5]} 
        rotation={[Math.PI / 2, 0, 0]} 
        geometry={carGeometry.wheelGeometry} 
        material={wheelMaterial} 
      />
      <mesh 
        ref={(el) => { if (el) wheelsRef.current[1] = el; }}
        position={[-0.35, -0.2, 0.5]} 
        rotation={[Math.PI / 2, 0, 0]} 
        geometry={carGeometry.wheelGeometry} 
        material={wheelMaterial} 
      />
      <mesh 
        ref={(el) => { if (el) wheelsRef.current[2] = el; }}
        position={[0.35, -0.2, -0.5]} 
        rotation={[Math.PI / 2, 0, 0]} 
        geometry={carGeometry.wheelGeometry} 
        material={wheelMaterial} 
      />
      <mesh 
        ref={(el) => { if (el) wheelsRef.current[3] = el; }}
        position={[-0.35, -0.2, -0.5]} 
        rotation={[Math.PI / 2, 0, 0]} 
        geometry={carGeometry.wheelGeometry} 
        material={wheelMaterial} 
      />

      {/* Wheel Rims */}
      {[
        [0.35, -0.2, 0.5], [-0.35, -0.2, 0.5],
        [0.35, -0.2, -0.5], [-0.35, -0.2, -0.5]
      ].map((pos, index) => (
        <mesh key={index} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.02, 6]} />
          <primitive object={rimMaterial} />
        </mesh>
      ))}

      {/* Headlights */}
      <mesh position={[0.25, -0.05, 0.8]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={0xffffaa} />
      </mesh>
      <mesh position={[-0.25, -0.05, 0.8]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={0xffffaa} />
      </mesh>

      {/* Taillights */}
      <mesh position={[0.2, -0.05, -0.8]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>
      <mesh position={[-0.2, -0.05, -0.8]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={0xff0000} />
      </mesh>

      {/* Spoiler for sports cars */}
      {isPlayer && (
        <mesh position={[0, 0.1, -0.7]}>
          <boxGeometry args={[0.6, 0.05, 0.2]} />
          <primitive object={carMaterial} />
        </mesh>
      )}
    </group>
  );
};