import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";

interface OrbProps {
  color?: string;
  emissive?: string;
  speed?: number;
  distort?: number;
  scale?: number;
  interactive?: boolean;
}

function InnerOrb({
  color = "#2DD4BF",
  emissive = "#0d5e56",
  speed = 1.6,
  distort = 0.28,
  scale = 1.35,
  interactive = true,
}: OrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Slow continuous ambient rotation
    meshRef.current.rotation.y += delta * 0.2;
    meshRef.current.rotation.x += delta * 0.08;

    // Smooth pointer parallax
    if (interactive && state.pointer) {
      targetRotation.current.x = state.pointer.y * 0.35;
      targetRotation.current.y = state.pointer.x * 0.35;

      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        targetRotation.current.x,
        0.05
      );
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotation.current.y,
        0.05
      );
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.6}>
      {/* Outer translucent wellness shell */}
      <mesh ref={meshRef} scale={scale}>
        <icosahedronGeometry args={[1, 32]} />
        <MeshDistortMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.15}
          distort={distort}
          speed={speed}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Inner luminous core */}
      <mesh scale={scale * 0.65}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color="#38BDF8"
          emissive="#209689"
          emissiveIntensity={0.9}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>
    </Float>
  );
}

interface WellnessOrb3DProps {
  className?: string;
  color?: string;
  emissive?: string;
  speed?: number;
  distort?: number;
  scale?: number;
  showSparkles?: boolean;
  interactive?: boolean;
}

export const WellnessOrb3D: React.FC<WellnessOrb3DProps> = ({
  className = "h-72 md:h-80 w-full",
  color = "#2DD4BF",
  emissive = "#0d5e56",
  speed = 1.6,
  distort = 0.28,
  scale = 1.35,
  showSparkles = true,
  interactive = true,
}) => {
  return (
    <div className={`relative flex items-center justify-center pointer-events-auto ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance", alpha: true, antialias: true }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 5, 4]} intensity={2.2} color="#FFFFFF" />
        <pointLight position={[-4, -3, -2]} intensity={1.4} color="#38BDF8" />

        <Suspense fallback={null}>
          <InnerOrb
            color={color}
            emissive={emissive}
            speed={speed}
            distort={distort}
            scale={scale}
            interactive={interactive}
          />
          {showSparkles && (
            <Sparkles
              count={45}
              scale={3.6}
              size={2.2}
              speed={0.4}
              color="#5EEAD4"
              opacity={0.55}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default WellnessOrb3D;
