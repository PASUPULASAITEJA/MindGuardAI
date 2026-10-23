import React, { useRef, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { ThreeErrorBoundary } from "./LazyCanvasWrapper";

interface OrbProps {
  color?: string;
  emissive?: string;
  speed?: number;
  distort?: number;
  scale?: number;
  interactive?: boolean;
  reducedMotion?: boolean;
}

function InnerWellnessOrb({
  color = "#38BDF8", // Soft Cyan
  emissive = "#1E1B4B", // Deep Indigo
  speed = 1.4,
  distort = 0.32,
  scale = 1.35,
  interactive = true,
  reducedMotion = false,
}: OrbProps) {
  const outerMeshRef = useRef<THREE.Mesh>(null);
  const coreMeshRef = useRef<THREE.Mesh>(null);
  const haloRingRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (reducedMotion) return;

    if (outerMeshRef.current) {
      // Smooth ambient rotation
      outerMeshRef.current.rotation.y += delta * 0.18;
      outerMeshRef.current.rotation.x += delta * 0.08;

      // Mouse-responsive parallax on desktop
      if (interactive && state.pointer) {
        targetRotation.current.x = state.pointer.y * 0.4;
        targetRotation.current.y = state.pointer.x * 0.4;

        outerMeshRef.current.rotation.x = THREE.MathUtils.lerp(
          outerMeshRef.current.rotation.x,
          targetRotation.current.x,
          0.04
        );
        outerMeshRef.current.rotation.y = THREE.MathUtils.lerp(
          outerMeshRef.current.rotation.y,
          targetRotation.current.y,
          0.04
        );
      }
    }

    if (haloRingRef.current) {
      haloRingRef.current.rotation.z += delta * 0.35;
      haloRingRef.current.rotation.x += delta * 0.12;
    }

    if (coreMeshRef.current) {
      // Gentle core pulse
      const pulse = Math.sin(state.clock.elapsedTime * 1.5) * 0.05 + 1.0;
      coreMeshRef.current.scale.setScalar(scale * 0.68 * pulse);
    }
  });

  return (
    <Float 
      speed={reducedMotion ? 0 : 1.8} 
      rotationIntensity={reducedMotion ? 0 : 0.4} 
      floatIntensity={reducedMotion ? 0 : 0.6}
    >
      {/* Outer translucent wellness shell */}
      <mesh ref={outerMeshRef} scale={scale}>
        <icosahedronGeometry args={[1, 32]} />
        <MeshDistortMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.65}
          roughness={0.18}
          metalness={0.2}
          distort={reducedMotion ? 0 : distort}
          speed={reducedMotion ? 0 : speed}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Inner luminous core with violet/teal gradient resonance */}
      <mesh ref={coreMeshRef} scale={scale * 0.68}>
        <sphereGeometry args={[1, 28, 28]} />
        <meshStandardMaterial
          color="#818CF8" // Soft Violet
          emissive="#2DD4BF" // Cyan/Teal glow
          emissiveIntensity={0.8}
          roughness={0.15}
          metalness={0.3}
        />
      </mesh>

      {/* Orbital subtle halo ring */}
      <mesh ref={haloRingRef} scale={scale * 1.45} rotation={[Math.PI / 4, Math.PI / 6, 0]}>
        <torusGeometry args={[1, 0.018, 16, 64]} />
        <meshStandardMaterial
          color="#5EEAD4"
          emissive="#38BDF8"
          emissiveIntensity={0.9}
          transparent
          opacity={0.6}
        />
      </mesh>
    </Float>
  );
}

export interface WellnessOrbProps {
  className?: string;
  color?: string;
  emissive?: string;
  speed?: number;
  distort?: number;
  scale?: number;
  showSparkles?: boolean;
  interactive?: boolean;
}

export const WellnessOrb: React.FC<WellnessOrbProps> = ({
  className = "h-72 md:h-80 w-full",
  color = "#38BDF8",
  emissive = "#1E1B4B",
  speed = 1.4,
  distort = 0.32,
  scale = 1.35,
  showSparkles = true,
  interactive = true,
}) => {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const staticFallback = (
    <div 
      className="flex h-full w-full items-center justify-center"
      role="img"
      aria-label="MindBridge AI 3D Wellness Orb - Glowing symbol of mental clarity and calm"
    >
      <div 
        className="h-44 w-44 rounded-full shadow-2xl relative"
        style={{
          background: "radial-gradient(circle at 35% 35%, #5eead4 0%, #38bdf8 30%, #818cf8 65%, #1e1b4b 100%)",
          boxShadow: "0 0 50px rgba(56, 189, 248, 0.45), inset 0 0 30px rgba(255, 255, 255, 0.4)",
        }}
      >
        <div className="absolute inset-2 rounded-full border border-white/20 animate-pulse" />
      </div>
    </div>
  );

  return (
    <ThreeErrorBoundary fallback={staticFallback}>
      <div 
        className={`relative flex items-center justify-center pointer-events-auto ${className}`}
        role="region"
        aria-label="Interactive 3D Wellness Orb"
      >
        <Canvas
          camera={{ position: [0, 0, 4.0], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ powerPreference: "high-performance", alpha: true, antialias: true }}
        >
          <ambientLight intensity={1.3} />
          <directionalLight position={[4, 5, 4]} intensity={2.2} color="#FFFFFF" />
          <pointLight position={[-4, -3, -2]} intensity={1.5} color="#818CF8" />
          <pointLight position={[3, -2, 2]} intensity={1.2} color="#2DD4BF" />

          <Suspense fallback={null}>
            <InnerWellnessOrb
              color={color}
              emissive={emissive}
              speed={speed}
              distort={distort}
              scale={scale}
              interactive={interactive}
              reducedMotion={prefersReducedMotion}
            />
            {showSparkles && !prefersReducedMotion && (
              <Sparkles
                count={42}
                scale={3.8}
                size={2.2}
                speed={0.35}
                color="#5EEAD4"
                opacity={0.55}
              />
            )}
          </Suspense>
        </Canvas>
      </div>
    </ThreeErrorBoundary>
  );
};

export default WellnessOrb;
