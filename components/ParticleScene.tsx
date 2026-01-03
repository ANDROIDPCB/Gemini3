import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Point3D } from '../types';

interface ParticleSceneProps {
  targetPoints: Point3D[];
  color: string;
  handOpenness: number; // 0 to 1
  handDetected: boolean;
}

const PARTICLE_COUNT = 4000;
const DAMPING_FACTOR = 0.06;
const EXPLOSION_SCALE = 6.0;

const Particles: React.FC<ParticleSceneProps> = ({ targetPoints, color, handOpenness, handDetected }) => {
  const meshRef = useRef<THREE.Points>(null);
  
  // Initialize 'current' positions to random noise
  const currentPositions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 15;
    }
    return pos;
  }, []);

  // Buffer geometry setup
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    return geo;
  }, [currentPositions]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.getElapsedTime();

    // Interaction Factor: 
    // If hand detected, use openness. 
    // If NOT detected, we default to 0 (formed shape) so the bottle/shape is visible by default.
    const activeOpenness = handDetected ? handOpenness : 0;
    
    // Breathing effect when idle (no hand interaction)
    const breathe = handDetected ? 0 : Math.sin(time * 1.5) * 0.05;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      
      // Get Target Coordinate
      // If we have fewer target points than particles, wrap around
      // We add a tiny bit of random jitter to the target so multiple particles don't stack perfectly on one point
      const targetIndex = i % (targetPoints.length || 1);
      const rawTarget = targetPoints.length > 0 ? targetPoints[targetIndex] : { x: 0, y: 0, z: 0 };
      
      const jitter = 0.02;
      const target = {
        x: rawTarget.x + (Math.random() - 0.5) * jitter,
        y: rawTarget.y + (Math.random() - 0.5) * jitter,
        z: rawTarget.z + (Math.random() - 0.5) * jitter
      };

      // Calculate Expansion (Explosion) Logic
      const noiseX = Math.sin(time * 2 + i * 0.1) * 0.5;
      const noiseY = Math.cos(time * 1.5 + i * 0.1) * 0.5;
      const noiseZ = Math.sin(time + i * 0.1) * 0.5;

      const baseScale = 1.8; // Base shape size (slightly larger for better visibility)
      
      let tx = target.x * baseScale * (1 + breathe);
      let ty = target.y * baseScale * (1 + breathe);
      let tz = target.z * baseScale * (1 + breathe);

      // Vector from center
      const len = Math.sqrt(tx*tx + ty*ty + tz*tz) + 0.001;
      const dirX = tx / len;
      const dirY = ty / len;
      const dirZ = tz / len;

      // Explode outwards logic
      // We use a non-linear curve for openness to make the "pop" feel more energetic
      const explosionForce = Math.pow(activeOpenness, 1.5) * EXPLOSION_SCALE;

      tx = tx + (dirX * explosionForce) + (noiseX * activeOpenness * 2.5);
      ty = ty + (dirY * explosionForce) + (noiseY * activeOpenness * 2.5);
      tz = tz + (dirZ * explosionForce) + (noiseZ * activeOpenness * 2.5);

      // Physics: Lerp current position to target position
      positions[i3] += (tx - positions[i3]) * DAMPING_FACTOR;
      positions[i3 + 1] += (ty - positions[i3 + 1]) * DAMPING_FACTOR;
      positions[i3 + 2] += (tz - positions[i3 + 2]) * DAMPING_FACTOR;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Gentle rotation of the whole system
    // Rotate faster if exploded for chaotic effect
    const rotationSpeed = 0.001 + (activeOpenness * 0.005);
    meshRef.current.rotation.y += rotationSpeed;
    meshRef.current.rotation.z = Math.sin(time * 0.2) * 0.1;
  });

  // Create a sprite for the particles to look like glowing orbs instead of squares
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        size={0.15}
        map={texture}
        color={color}
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const ParticleScene: React.FC<ParticleSceneProps> = (props) => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 2]}>
        <Particles {...props} />
        <OrbitControls enableZoom={true} enablePan={false} maxDistance={20} minDistance={2} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color={props.color} />
      </Canvas>
    </div>
  );
};

export default ParticleScene;