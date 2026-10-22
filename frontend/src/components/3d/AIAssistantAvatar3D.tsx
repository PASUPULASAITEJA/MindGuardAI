import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

interface AIAssistantAvatarProps {
  isThinking?: boolean;
}

function InnerAvatarMesh({ isThinking = false }: AIAssistantAvatarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Fast rotation when thinking, gentle rotation when idle
    const rotSpeed = isThinking ? 0.8 : 0.25;
    meshRef.current.rotation.y += delta * rotSpeed;
    meshRef.current.rotation.x += delta * (rotSpeed * 0.4);

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (isThinking ? 1.8 : 0.6);
      ringRef.current.rotation.x += delta * (isThinking ? 0.9 : 0.3);
    }

    if (ringRef2.current) {
      ringRef2.current.rotation.y -= delta * (isThinking ? 1.6 : 0.5);
      ringRef2.current.rotation.z += delta * (isThinking ? 1.0 : 0.4);
    }

    // Interactive pointer gaze
    if (state.pointer) {
      meshRef.current.position.x = THREE.MathUtils.lerp(
        meshRef.current.position.x,
        state.pointer.x * 0.2,
        0.05
      );
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        state.pointer.y * 0.2,
        0.05
      );
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.7}>
      {/* Central AI Mind Core */}
      <mesh ref={meshRef} scale={1.15}>
        <icosahedronGeometry args={[1, 32]} />
        <MeshDistortMaterial
          color={isThinking ? "#8B5CF6" : "#209689"}
          emissive={isThinking ? "#6D28D9" : "#0D9488"}
          emissiveIntensity={isThinking ? 0.85 : 0.55}
          roughness={0.15}
          metalness={0.3}
          distort={isThinking ? 0.45 : 0.22}
          speed={isThinking ? 3.5 : 1.5}
        />
      </mesh>

      {/* Orbital Neural Ring 1 */}
      <mesh ref={ringRef} scale={1.55}>
        <torusGeometry args={[1, 0.03, 16, 64]} />
        <meshStandardMaterial
          color={isThinking ? "#C084FC" : "#5EEAD4"}
          emissive={isThinking ? "#A855F7" : "#14B8A6"}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Orbital Neural Ring 2 */}
      <mesh ref={ringRef2} scale={1.75} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1, 0.025, 16, 64]} />
        <meshStandardMaterial
          color={isThinking ? "#E879F9" : "#38BDF8"}
          emissive={isThinking ? "#C026D3" : "#0284C7"}
          emissiveIntensity={0.7}
        />
      </mesh>
    </Float>
  );
}

interface AIAssistantAvatar3DProps {
  isThinking?: boolean;
  className?: string;
}

export const AIAssistantAvatar3D: React.FC<AIAssistantAvatar3DProps> = ({
  isThinking = false,
  className = "h-20 w-20 md:h-24 md:w-24",
}) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance", alpha: true, antialias: true }}
      >
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 3, 3]} intensity={2.0} />
        <pointLight position={[-3, -2, -1]} intensity={1.2} color="#A78BFA" />

        <Suspense fallback={null}>
          <InnerAvatarMesh isThinking={isThinking} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default AIAssistantAvatar3D;
