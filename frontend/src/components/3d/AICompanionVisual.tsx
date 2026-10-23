import React, { useRef, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { ThreeErrorBoundary } from "./LazyCanvasWrapper";

interface InnerCompanionMeshProps {
  isThinking?: boolean;
  reducedMotion?: boolean;
}

function InnerCompanionMesh({ isThinking = false, reducedMotion = false }: InnerCompanionMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (reducedMotion) return;

    // Fast rotation when thinking, gentle calming drift when idle
    const rotSpeed = isThinking ? 0.95 : 0.25;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * rotSpeed;
      meshRef.current.rotation.x += delta * (rotSpeed * 0.45);

      // Interactive pointer gaze
      if (state.pointer) {
        meshRef.current.position.x = THREE.MathUtils.lerp(
          meshRef.current.position.x,
          state.pointer.x * 0.22,
          0.05
        );
        meshRef.current.position.y = THREE.MathUtils.lerp(
          meshRef.current.position.y,
          state.pointer.y * 0.22,
          0.05
        );
      }
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * (isThinking ? 2.2 : 0.6);
      ring1Ref.current.rotation.x += delta * (isThinking ? 1.1 : 0.3);
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * (isThinking ? 1.8 : 0.5);
      ring2Ref.current.rotation.z += delta * (isThinking ? 1.2 : 0.4);
    }
  });

  return (
    <Float 
      speed={reducedMotion ? 0 : isThinking ? 3.0 : 1.8} 
      rotationIntensity={reducedMotion ? 0 : 0.45} 
      floatIntensity={reducedMotion ? 0 : 0.65}
    >
      {/* Central AI Mind Core */}
      <mesh ref={meshRef} scale={1.15}>
        <icosahedronGeometry args={[1, 32]} />
        <MeshDistortMaterial
          color={isThinking ? "#8B5CF6" : "#209689"}
          emissive={isThinking ? "#6D28D9" : "#0D9488"}
          emissiveIntensity={isThinking ? 0.9 : 0.55}
          roughness={0.16}
          metalness={0.28}
          distort={reducedMotion ? 0 : isThinking ? 0.45 : 0.22}
          speed={reducedMotion ? 0 : isThinking ? 3.8 : 1.5}
        />
      </mesh>

      {/* Orbital Neural Ring 1 (Horizontal Inclination) */}
      <mesh ref={ring1Ref} scale={1.55}>
        <torusGeometry args={[1, 0.03, 16, 64]} />
        <meshStandardMaterial
          color={isThinking ? "#C084FC" : "#5EEAD4"}
          emissive={isThinking ? "#A855F7" : "#14B8A6"}
          emissiveIntensity={0.85}
        />
      </mesh>

      {/* Orbital Neural Ring 2 (Tilted Inclination) */}
      <mesh ref={ring2Ref} scale={1.75} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1, 0.025, 16, 64]} />
        <meshStandardMaterial
          color={isThinking ? "#F472B6" : "#38BDF8"}
          emissive={isThinking ? "#DB2777" : "#0284C7"}
          emissiveIntensity={0.75}
        />
      </mesh>
    </Float>
  );
}

export interface AICompanionVisualProps {
  isThinking?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const AICompanionVisual: React.FC<AICompanionVisualProps> = ({
  isThinking = false,
  className = "",
  size = "md",
}) => {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-20 w-20 md:h-24 md:w-24",
    lg: "h-28 w-28 md:h-32 md:w-32",
  };

  const finalClass = `${sizeClasses[size]} ${className}`;

  const staticFallback = (
    <div 
      className={`relative flex items-center justify-center rounded-full bg-primary/10 border border-primary/20 ${finalClass}`}
      role="img"
      aria-label={
        isThinking
          ? "MindBridge AI companion is formulating a supportive response"
          : "MindBridge AI companion is ready and listening"
      }
    >
      <div 
        className={`rounded-full transition-all duration-300 ${
          isThinking 
            ? "h-3/4 w-3/4 bg-purple-500/80 animate-pulse shadow-lg shadow-purple-500/40" 
            : "h-2/3 w-2/3 bg-teal-500/80 shadow-md shadow-teal-500/30"
        }`} 
      />
    </div>
  );

  return (
    <ThreeErrorBoundary fallback={staticFallback}>
      <div 
        className={`relative flex items-center justify-center shrink-0 ${finalClass}`}
        role="region"
        aria-label={
          isThinking
            ? "MindBridge AI companion processing state"
            : "MindBridge AI companion idle state"
        }
      >
        <Canvas
          camera={{ position: [0, 0, 3.8], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ powerPreference: "high-performance", alpha: true, antialias: true }}
        >
          <ambientLight intensity={1.4} />
          <directionalLight position={[3, 3, 3]} intensity={2.0} />
          <pointLight position={[-3, -2, -1]} intensity={1.4} color={isThinking ? "#C084FC" : "#38BDF8"} />

          <Suspense fallback={null}>
            <InnerCompanionMesh isThinking={isThinking} reducedMotion={prefersReducedMotion} />
          </Suspense>
        </Canvas>
      </div>
    </ThreeErrorBoundary>
  );
};

export default AICompanionVisual;
