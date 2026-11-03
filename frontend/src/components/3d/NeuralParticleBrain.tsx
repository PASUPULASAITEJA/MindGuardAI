import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ThreeErrorBoundary } from "./LazyCanvasWrapper";

export type BrainMood = "calm" | "focus" | "alert";

interface NeuralParticleBrainProps {
  mood?: BrainMood;
  interactive?: boolean;
  className?: string;
  particleCount?: number;
}

// Procedural 3D Brain Geometry Generator
function generateBrainPoints(count: number = 1800) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const originalPos: [number, number, number][] = [];

  const baseTeal = new THREE.Color("#0ea5e9");
  const baseViolet = new THREE.Color("#8b5cf6");
  const baseEmerald = new THREE.Color("#10b981");

  let i = 0;
  while (i < count) {
    // Determine hemisphere: -1 for left, +1 for right
    const hemisphere = Math.random() > 0.5 ? 1 : -1;

    // Spherical coordinates
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);

    // Anatomical brain scaling factors (Length > Height > Width)
    let rx = 1.05;
    let ry = 1.15;
    let rz = 1.45;

    // Cortex folds (gyri & sulci) simulation via sinusoidal deformation
    const foldFrequency = 6.5;
    const foldAmplitude = 0.14;
    const fold = 1 + foldAmplitude * Math.sin(theta * foldFrequency) * Math.cos(phi * foldFrequency);

    // Base point in sphere
    let x = Math.sin(phi) * Math.cos(theta) * rx * fold;
    let y = Math.cos(phi) * ry * fold;
    let z = Math.sin(phi) * Math.sin(theta) * rz * fold;

    // Hemispheric division and separation
    x = x * 0.78 + hemisphere * 0.42;

    // Cerebellum & temporal lobe indentation shaping
    if (y < -0.3 && z < -0.2) {
      // Lower back: cerebellum tuck
      x *= 0.85;
      z *= 0.9;
    }
    if (y < -0.2 && z > 0.1 && z < 0.7) {
      // Temporal lobe protrusion
      x *= 1.12;
    }

    // Longitudinal fissure indent (gap between left and right hemispheres)
    if (Math.abs(x) < 0.22) {
      continue; // keep the central groove clear
    }

    // Add internal volume density
    const depthFactor = 0.75 + Math.random() * 0.25;
    x *= depthFactor;
    y *= depthFactor;
    z *= depthFactor;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    originalPos.push([x, y, z]);

    // Color gradient across lobes
    // Frontal (z > 0): Cyan / Teal
    // Parietal / Occipital (z <= 0): Violet / Electric Indigo
    const colorMix = (z + 1.2) / 2.4;
    const mixedColor = new THREE.Color().lerpColors(baseViolet, baseTeal, colorMix);

    if (Math.random() > 0.85) {
      // Accent synapses in emerald
      mixedColor.lerp(baseEmerald, 0.6);
    }

    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;

    sizes[i] = Math.random() * 2.2 + 1.2;
    i++;
  }

  // Generate synaptic connections (edges between nearby neurons)
  const linePositions: number[] = [];
  const lineColors: number[] = [];
  const maxDistance = 0.38;
  const maxConnectionsPerNode = 3;

  for (let a = 0; a < count; a += 3) {
    let connections = 0;
    const ax = positions[a * 3];
    const ay = positions[a * 3 + 1];
    const az = positions[a * 3 + 2];

    for (let b = a + 1; b < count && connections < maxConnectionsPerNode; b += 2) {
      const bx = positions[b * 3];
      const by = positions[b * 3 + 1];
      const bz = positions[b * 3 + 2];

      const dx = ax - bx;
      const dy = ay - by;
      const dz = az - bz;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < maxDistance * maxDistance) {
        linePositions.push(ax, ay, az, bx, by, bz);
        // Dim translucent lines
        lineColors.push(
          colors[a * 3] * 0.7, colors[a * 3 + 1] * 0.7, colors[a * 3 + 2] * 0.7,
          colors[b * 3] * 0.7, colors[b * 3 + 1] * 0.7, colors[b * 3 + 2] * 0.7
        );
        connections++;
      }
    }
  }

  return {
    positions,
    colors,
    sizes,
    originalPos,
    linePositions: new Float32Array(linePositions),
    lineColors: new Float32Array(lineColors),
  };
}

// Inner 3D Neural Mesh
function BrainParticlesMesh({ mood = "calm" }: { mood?: BrainMood }) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef(0);

  const { positions, colors, linePositions, lineColors } = useMemo(
    () => generateBrainPoints(1400),
    []
  );

  const pointsGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  const linesGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));
    return geo;
  }, [linePositions, lineColors]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth continuous auto-rotation
    const baseSpeed = mood === "focus" ? 0.35 : mood === "alert" ? 0.55 : 0.22;
    groupRef.current.rotation.y += delta * baseSpeed;

    // Subtle sinusoidal breathing tilt
    const time = state.clock.getElapsedTime();
    groupRef.current.rotation.x = Math.sin(time * 0.6) * 0.08 + 0.15;
    groupRef.current.rotation.z = Math.cos(time * 0.4) * 0.05;

    // Pointer interactive tracking
    if (state.pointer) {
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        state.pointer.x * 0.35,
        0.05
      );
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        state.pointer.y * 0.3,
        0.05
      );
    }

    // Synaptic pulse excitation
    pulseRef.current += delta * 2.5;
    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      mat.size = 2.4 + Math.sin(pulseRef.current) * 0.45;
    }
  });

  return (
    <group ref={groupRef} scale={1.45}>
      {/* 1. Synaptic connection lines */}
      <lineSegments ref={linesRef} geometry={linesGeometry}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={mood === "focus" ? 0.38 : 0.24}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* 2. Neural Cortex Particle Cloud */}
      <points ref={pointsRef} geometry={pointsGeometry}>
        <pointsMaterial
          size={2.6}
          vertexColors
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>

      {/* 3. Central Ambient Neural Glow Core */}
      <mesh scale={0.75}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={mood === "focus" ? "#8b5cf6" : mood === "alert" ? "#ef4444" : "#0ea5e9"}
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// Fallback when WebGL is unsupported
const BrainFallback = () => (
  <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
    <div className="relative h-44 w-44 rounded-full bg-gradient-to-tr from-cyan-500/20 via-primary/20 to-violet-500/20 p-1 animate-pulse border border-primary/30 flex items-center justify-center shadow-[0_0_50px_-10px_rgba(14,165,233,0.3)]">
      <div className="h-full w-full rounded-full bg-card/80 backdrop-blur-md flex flex-col items-center justify-center">
        <span className="text-3xl">🧠</span>
        <span className="text-xs font-bold text-primary mt-2">MindGuard AI Core</span>
      </div>
    </div>
  </div>
);

// Main Export Component
export const NeuralParticleBrain: React.FC<NeuralParticleBrainProps> = ({
  mood = "calm",
  className = "w-full h-[400px] md:h-[480px]",
}) => {
  const [activeMood, setActiveMood] = useState<BrainMood>(mood);

  useEffect(() => {
    setActiveMood(mood);
  }, [mood]);

  return (
    <div className={`relative ${className} select-none overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl shadow-2xl group`}>
      {/* Background radial atmosphere */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-violet-600/15 blur-[90px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.06),transparent_70%)]" />

      {/* Floating HUD Badges */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="text-[11px] font-bold text-cyan-300 tracking-wider uppercase">
            Cognitive Synapse Engine
          </span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
        <button
          onClick={() => setActiveMood("calm")}
          className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${
            activeMood === "calm"
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              : "bg-white/[0.03] text-muted-foreground border-white/5 hover:bg-white/[0.08]"
          }`}
        >
          Calm
        </button>
        <button
          onClick={() => setActiveMood("focus")}
          className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${
            activeMood === "focus"
              ? "bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
              : "bg-white/[0.03] text-muted-foreground border-white/5 hover:bg-white/[0.08]"
          }`}
        >
          Focus
        </button>
      </div>

      {/* Bottom Telemetry Ticker */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-[11px] text-muted-foreground/80 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-foreground/90 font-medium">1,400 Neurons</span>
          <span>•</span>
          <span className="text-cyan-400 font-medium">Real-time Biometrics</span>
        </div>
        <div className="text-[10px] text-muted-foreground">
          Drag to rotate • Move cursor
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <ThreeErrorBoundary fallback={<BrainFallback />}>
        <Canvas
          camera={{ position: [0, 0, 4.2], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          className="cursor-grab active:cursor-grabbing"
        >
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={1.2} color="#0ea5e9" />
          <pointLight position={[-10, -10, -10]} intensity={0.9} color="#8b5cf6" />
          
          <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.35}>
            <BrainParticlesMesh mood={activeMood} />
          </Float>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.65}
            dampingFactor={0.08}
            autoRotate={false}
          />
        </Canvas>
      </ThreeErrorBoundary>
    </div>
  );
};

export default NeuralParticleBrain;
