import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";

interface BreathingSphereProps {
  phase: "Inhale" | "Hold" | "Exhale" | string;
  isActive?: boolean;
}

function AnimatedBreathingMesh({ phase, isActive = true }: BreathingSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const currentScale = useRef(1.0);

  // Target scale based on breathing phase
  const targetScale = !isActive
    ? 1.0
    : phase === "Inhale"
    ? 1.45
    : phase === "Exhale"
    ? 0.8
    : 1.35; // Hold retains expanded volume

  // Color shifting based on phase
  const targetColor = phase === "Inhale" 
    ? new THREE.Color("#6366F1") // Calming Deep Indigo
    : phase === "Exhale"
    ? new THREE.Color("#10B981") // Grounding Emerald
    : new THREE.Color("#F59E0B"); // Warm Amber Hold

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Smooth volumetric interpolation
    const lerpSpeed = phase === "Inhale" || phase === "Exhale" ? 1.0 : 2.5;
    currentScale.current = THREE.MathUtils.lerp(
      currentScale.current,
      targetScale,
      delta * lerpSpeed
    );

    meshRef.current.scale.setScalar(currentScale.current);
    if (coreRef.current) {
      coreRef.current.scale.setScalar(currentScale.current * 0.62);
    }

    // Continuous slow meditative spin
    meshRef.current.rotation.y += delta * 0.25;
    meshRef.current.rotation.x += delta * 0.1;
  });

  return (
    <group>
      {/* Outer breathing aura */}
      <mesh ref={meshRef} scale={1.0}>
        <icosahedronGeometry args={[1, 32]} />
        <MeshDistortMaterial
          color={targetColor}
          emissive={phase === "Inhale" ? "#4338CA" : phase === "Exhale" ? "#065F46" : "#B45309"}
          emissiveIntensity={0.65}
          roughness={0.2}
          metalness={0.2}
          distort={0.32}
          speed={phase === "Inhale" ? 2.4 : 1.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Luminous inner respiratory nucleus */}
      <mesh ref={coreRef} scale={0.62}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive={phase === "Inhale" ? "#818CF8" : phase === "Exhale" ? "#34D399" : "#FBBF24"}
          emissiveIntensity={0.9}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

interface BreathingSphere3DProps {
  phase: "Inhale" | "Hold" | "Exhale" | string;
  isActive?: boolean;
  className?: string;
}

export const BreathingSphere3D: React.FC<BreathingSphere3DProps> = ({
  phase,
  isActive = true,
  className = "h-56 w-56 md:h-64 md:w-64",
}) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 3.4], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance", alpha: true, antialias: true }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 4, 3]} intensity={2.0} />
        <pointLight position={[-3, -3, -2]} intensity={1.5} color="#818CF8" />

        <Suspense fallback={null}>
          <AnimatedBreathingMesh phase={phase} isActive={isActive} />
          <Sparkles
            count={36}
            scale={3.2}
            size={2.0}
            speed={isActive ? 0.6 : 0.2}
            color={phase === "Inhale" ? "#A5B4FC" : phase === "Exhale" ? "#6EE7B7" : "#FDE68A"}
            opacity={0.6}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default BreathingSphere3D;
