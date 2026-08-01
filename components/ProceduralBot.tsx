'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Capsule, RoundedBox, Center } from '@react-three/drei';
import * as THREE from 'three';

interface BotProps {
  isLoading?: boolean;
}

export default function ProceduralBot({ isLoading = false }: BotProps) {
  const botGroupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const eyeLeftMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const eyeRightMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // 1. Ultra-Smooth Cinematic Floating
    if (botGroupRef.current) {
      const hoverSpeed = isLoading ? 4 : 2;
      const hoverAmplitude = isLoading ? 0.08 : 0.04;
      botGroupRef.current.position.y = Math.sin(time * hoverSpeed) * hoverAmplitude;
    }

    // 2. Pure Autonomous Idle "Look Around"
    if (headRef.current) {
      const targetRotY = Math.sin(time * 0.5) * 0.2;
      const targetRotX = Math.sin(time * 0.7) * 0.05;
      
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetRotY, delta * 4);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetRotX, delta * 4);
    }

    // 3. Simple Loading Pulse 
    if (eyeLeftMatRef.current && eyeRightMatRef.current) {
      const pulse = isLoading ? Math.abs(Math.sin(time * 5)) * 1.5 + 0.5 : 1.2;
      
      eyeLeftMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(eyeLeftMatRef.current.emissiveIntensity, pulse, delta * 5);
      eyeRightMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(eyeRightMatRef.current.emissiveIntensity, pulse, delta * 5);
    }
  });

  // 🛡️ THE FIX: Tactical Matte Materials. 
  // High roughness (0.85) and low metalness absorbs light perfectly without harsh reflections.
  const matteAlloy = <meshStandardMaterial color="#1e293b" roughness={0.85} metalness={0.2} />;
  const matteVisor = <meshStandardMaterial color="#020617" roughness={0.9} metalness={0.1} />;
  const cyanAccent = <meshStandardMaterial color="#0284c7" roughness={0.7} metalness={0.3} />;

  return (
    <Center>
      <group ref={botGroupRef} scale={1.1}>
        
        {/* HEAD */}
        <group ref={headRef} position={[0, 0.9, 0]}>
          <Sphere args={[0.75, 32, 32]} scale={[1.15, 0.85, 0.95]}>{matteAlloy}</Sphere>
          <Sphere args={[0.7, 32, 32]} position={[0, 0, 0.1]} scale={[1.06, 0.76, 0.86]}>{matteVisor}</Sphere>

          {/* Eyes (Crisp LED look instead of blooming blur) */}
          <group position={[0, 0.05, 0.85]}>
            <group position={[-0.28, 0, 0]} rotation={[0, 0, 0.05]}>
              <RoundedBox args={[0.22, 0.05, 0.05]} radius={0.02} smoothness={4}>
                <meshStandardMaterial ref={eyeLeftMatRef} color="#22d3ee" emissive="#22d3ee" toneMapped={false} />
              </RoundedBox>
            </group>
            <group position={[0.28, 0, 0]} rotation={[0, 0, -0.05]}>
              <RoundedBox args={[0.22, 0.05, 0.05]} radius={0.02} smoothness={4}>
                <meshStandardMaterial ref={eyeRightMatRef} color="#22d3ee" emissive="#22d3ee" toneMapped={false} />
              </RoundedBox>
            </group>
          </group>

          {/* Earpieces */}
          <group position={[-0.85, 0, 0]}>
            <Cylinder args={[0.22, 0.22, 0.12, 24]} rotation={[0, 0, Math.PI / 2]}>{matteAlloy}</Cylinder>
            <Capsule args={[0.02, 0.2]} position={[-0.08, 0.25, 0]}>{cyanAccent}</Capsule>
          </group>
          <group position={[0.85, 0, 0]}>
            <Cylinder args={[0.22, 0.22, 0.12, 24]} rotation={[0, 0, Math.PI / 2]}>{matteAlloy}</Cylinder>
            <Capsule args={[0.02, 0.2]} position={[0.08, 0.25, 0]}>{cyanAccent}</Capsule>
          </group>
        </group>

        {/* TORSO */}
        <group position={[0, -0.1, 0]}>
          <Capsule args={[0.5, 0.35, 24, 32]}>{matteAlloy}</Capsule>
          {/* Glowing Core - Scaled down slightly to look more like a precision status indicator */}
          <Sphere args={[0.32, 24, 24]} position={[0, -0.05, 0.38]} scale={[0.8, 0.6, 0.3]}>
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.6} toneMapped={false} />
          </Sphere>
        </group>

        {/* Floating Arms */}
        <Capsule args={[0.12, 0.35, 16, 24]} position={[-0.72, 0.05, 0]} rotation={[0, 0, -0.35]}>{matteAlloy}</Capsule>
        <Capsule args={[0.12, 0.35, 16, 24]} position={[0.72, 0.05, 0]} rotation={[0, 0, 0.35]}>{matteAlloy}</Capsule>
      </group>
    </Center>
  );
}