import React, { useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { Brain, Sparkles, RefreshCw, Eye } from "lucide-react";

export interface NeuralBrain3DProps {
  className?: string;
  particleCount?: number;
  interactive?: boolean;
  autoRotate?: boolean;
  rotationSpeed?: number;
  glowIntensity?: number;
  pulseSpeed?: number;
  synapseDensity?: number;
  themeMode?: "dark" | "light";
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

/**
 * Generates an anatomically structured 3D point cloud of the human brain:
 * - Dual cerebral hemispheres separated by the longitudinal fissure
 * - Cortical convolutions (gyri and sulci)
 * - Temporal, frontal, parietal, and occipital lobes
 * - Posterior cerebellum and brainstem
 */
function generateBrainData(count: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const traits = new Float32Array(count * 4); // [hemi, region, randPhase, depth]

  let seed = 42;
  const rnd = () => {
    seed = (16807 * seed) % 2147483647;
    return seed / 2147483647;
  };
  const gauss = () =>
    Math.sqrt(-2 * Math.log(Math.max(rnd(), 1e-9))) * Math.cos(Math.PI * 2 * rnd());

  // Colors: Cyan (left hemisphere/logic), Violet (right hemisphere/creativity), Teal (cerebellum)
  const leftColor = new THREE.Color("#38BDF8"); // Cyan
  const rightColor = new THREE.Color("#C084FC"); // Violet
  const stemColor = new THREE.Color("#2DD4BF"); // Teal

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const i4 = i * 4;
    const hemi = rnd() < 0.5 ? -1 : 1;
    const regChoice = rnd();

    let x = 0;
    let y = 0;
    let z = 0;
    let region = 0;
    let depth = 0;

    if (regChoice < 0.8) {
      // 1. Cerebral Cortex
      region = 0;
      const u = rnd();
      const v = rnd();
      const theta = u * Math.PI;
      const phi = v * Math.PI * 2;

      const rx = 0.76;
      const ry = 0.9;
      const rz = 1.16;

      // Cortical gyri / sulci convolutions
      const gyri =
        0.08 * Math.sin(7 * theta) * Math.cos(6 * phi) +
        0.05 * Math.sin(14 * theta + 3 * phi) +
        0.03 * Math.cos(18 * phi);

      // Distribute from surface deep into white matter
      const depthFactor = Math.cbrt(rnd());
      depth = depthFactor;
      const rad = (0.78 + 0.22 * depthFactor) * (1.0 + gyri);

      x = hemi * (0.12 + rx * rad * Math.sin(theta) * Math.cos(phi) * 0.88);
      y = ry * rad * Math.cos(theta) * 0.95;
      z = rz * rad * Math.sin(theta) * Math.sin(phi);

      // Clear the medial longitudinal fissure
      if (Math.abs(x) < 0.14) {
        x = hemi * (0.11 + Math.abs(x) * 0.35);
      }

      // Temporal lobe lateral expansion
      if (y < -0.05 && z > -0.2 && z < 0.45) {
        x *= 1.14;
      }
    } else if (regChoice < 0.94) {
      // 2. Cerebellum (lower posterior lobes)
      region = 1;
      const u = rnd();
      const v = rnd();
      const theta = u * Math.PI;
      const phi = v * Math.PI * 2;
      const rad = 0.38 * Math.cbrt(rnd());
      depth = rad / 0.38;

      x = hemi * 0.32 + rad * Math.sin(theta) * Math.cos(phi) * 0.85;
      y = -0.46 + rad * Math.cos(theta) * 0.72;
      z = -0.56 + rad * Math.sin(theta) * Math.sin(phi) * 0.82;
    } else {
      // 3. Brainstem
      region = 2;
      const t = rnd();
      const r = 0.11 * Math.sqrt(rnd());
      const ang = rnd() * Math.PI * 2;
      x = r * Math.cos(ang);
      y = -0.42 - t * 0.52;
      z = -0.16 - t * 0.12 + r * Math.sin(ang);
      depth = 1.0 - t;
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    // Color gradient based on hemisphere and depth
    const baseColor =
      region === 2
        ? stemColor
        : hemi < 0
        ? leftColor.clone().lerp(stemColor, (y + 1) * 0.25)
        : rightColor.clone().lerp(leftColor, (y + 1) * 0.25);

    // Deep white matter is slightly dimmer and cooler
    baseColor.multiplyScalar(0.7 + 0.3 * depth);

    colors[i3] = baseColor.r;
    colors[i3 + 1] = baseColor.g;
    colors[i3 + 2] = baseColor.b;

    traits[i4] = hemi;
    traits[i4 + 1] = region;
    traits[i4 + 2] = rnd(); // random twinkle phase
    traits[i4 + 3] = depth;
  }

  return { positions, colors, traits };
}

/**
 * Generates synaptic connection lines between nearest neighboring cortical neurons
 */
function generateSynapseLines(positions: Float32Array, count: number, maxLines: number = 600) {
  const lineIndices: number[] = [];
  const linePositions: number[] = [];
  const stride = 18; // sample every Nth point to keep 60fps

  for (let i = 0; i < count; i += stride) {
    const x1 = positions[i * 3];
    const y1 = positions[i * 3 + 1];
    const z1 = positions[i * 3 + 2];

    let connections = 0;
    for (let j = i + stride; j < count; j += stride) {
      if (linePositions.length / 6 >= maxLines) break;
      const x2 = positions[j * 3];
      const y2 = positions[j * 3 + 1];
      const z2 = positions[j * 3 + 2];

      const dx = x2 - x1;
      const dy = y2 - y1;
      const dz = z2 - z1;
      const distSq = dx * dx + dy * dy + dz * dz;

      // Connect if within tight synaptic radius and same hemisphere
      if (distSq < 0.045 && distSq > 0.005) {
        linePositions.push(x1, y1, z1, x2, y2, z2);
        connections++;
        if (connections >= 2) break;
      }
    }
  }

  return new Float32Array(linePositions);
}

const brainVertexShader = `
uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
uniform float uPulseSpeed;
uniform vec3 uPointer;
uniform float uPointerActive;
uniform float uActionPotential;

attribute vec4 aTraits;
attribute vec3 aColor;

varying vec3 vColor;
varying float vGain;

void main() {
  vec3 p = position;
  float hemi = aTraits.x;
  float region = aTraits.y;
  float randPhase = aTraits.z;
  float depth = aTraits.w;

  // 1. Cognitive Breathing Rhythm (sinusoidal alpha wave ~0.2Hz)
  float breath = sin(uTime * uPulseSpeed * 1.5) * 0.035;
  p *= 1.0 + breath * (1.0 - depth * 0.5);

  // 2. Action Potential Wave: traveling front of synaptic light from frontal to occipital lobe
  float waveFront = fract(uTime * 0.35 + randPhase * 0.15);
  float waveDist = abs(p.z * 0.4 + p.y * 0.3 - (waveFront * 2.0 - 1.0));
  float actionPulse = smoothstep(0.18, 0.0, waveDist) * uActionPotential;

  // 3. Pointer Synaptic Activation: cursor proximity excites local neural cluster
  float cursorDist = length(p - uPointer);
  float cursorExcitement = smoothstep(0.7, 0.0, cursorDist) * uPointerActive;

  // Position transform
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Particle size calculation with depth attenuation
  float pSize = uSize * uPixelRatio * (2.8 / -mvPosition.z);
  pSize *= 1.0 + actionPulse * 1.5 + cursorExcitement * 2.0;
  gl_PointSize = clamp(pSize, 1.5, 24.0);

  // Color dynamics: amplify brightness when firing action potentials or cursor excitement
  vec3 col = aColor;
  vec3 firingCol = hemi < 0.0 ? vec3(0.35, 0.95, 1.0) : vec3(0.9, 0.5, 1.0);
  col = mix(col, firingCol, actionPulse * 0.8 + cursorExcitement * 0.6);
  col += vec3(1.0, 1.0, 1.0) * (actionPulse * 0.4 + cursorExcitement * 0.5);

  // Twinkle / neural baseline firing
  float twinkle = 0.8 + 0.2 * sin(uTime * 3.0 + randPhase * 6.28);

  vColor = col;
  vGain = (0.75 + actionPulse * 1.2 + cursorExcitement * 1.5) * twinkle;
}
`;

const brainFragmentShader = `
precision highp float;

varying vec3 vColor;
varying float vGain;

void main() {
  vec2 coord = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(coord, coord);
  if (r2 > 1.0) discard;

  // Dual-layer soft gaussian nucleus + outer radiant synaptic glow
  float core = exp(-r2 * 8.0);
  float halo = exp(-r2 * 2.5) * 0.4;
  float alpha = (core + halo) * vGain;

  gl_FragColor = vec4(vColor * (core * 1.4 + halo), clamp(alpha, 0.0, 1.0));
}
`;

export const NeuralBrain3D: React.FC<NeuralBrain3DProps> = ({
  className = "",
  particleCount = 14000,
  interactive = true,
  autoRotate = true,
  rotationSpeed = 0.4,
  glowIntensity = 1.0,
  pulseSpeed = 1.0,
  themeMode = "dark",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFiringActionPotential, setIsFiringActionPotential] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check reduced motion
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.2, 3.4);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth || 400, container.clientHeight || 400);
    container.appendChild(renderer.domElement);

    // Group to hold brain particles & synapses
    const brainGroup = new THREE.Group();
    // Default anatomical pitch
    brainGroup.rotation.x = 0.15;
    brainGroup.rotation.y = 0.45;
    scene.add(brainGroup);

    // 1. Generate Anatomical Brain Geometry
    const brainData = generateBrainData(particleCount);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(brainData.positions, 3)
    );
    geometry.setAttribute(
      "aColor",
      new THREE.BufferAttribute(brainData.colors, 3)
    );
    geometry.setAttribute(
      "aTraits",
      new THREE.BufferAttribute(brainData.traits, 4)
    );

    const brainMaterial = new THREE.ShaderMaterial({
      vertexShader: brainVertexShader,
      fragmentShader: brainFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uSize: { value: 2.2 },
        uPulseSpeed: { value: pulseSpeed },
        uPointer: { value: new THREE.Vector3(100, 100, 100) },
        uPointerActive: { value: 0 },
        uActionPotential: { value: 1.0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, brainMaterial);
    brainGroup.add(particles);

    // 2. Synaptic Axon Lines
    const synapsePositions = generateSynapseLines(brainData.positions, particleCount, 850);
    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute("position", new THREE.BufferAttribute(synapsePositions, 3));

    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#38BDF8"),
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    const synapseLines = new THREE.LineSegments(lineGeom, lineMat);
    brainGroup.add(synapseLines);

    // 3. Central Synaptic Core Glow
    const coreGlowGeom = new THREE.SphereGeometry(0.35, 16, 16);
    const coreGlowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#0EA5E9"),
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
    });
    const coreGlow = new THREE.Mesh(coreGlowGeom, coreGlowMat);
    brainGroup.add(coreGlow);

    // Pointer & Parallax tracking
    const targetRotation = { x: 0.15, y: 0.45 };
    const currentRotation = { x: 0.15, y: 0.45 };
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2(-100, -100);

    const onPointerMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseNDC.set(x, y);

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetRotation.y += deltaX * 0.008;
        targetRotation.x += deltaY * 0.008;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        // Gentle parallax gaze
        targetRotation.y = 0.45 + x * 0.65;
        targetRotation.x = 0.15 - y * 0.45;
      }

      // Update pointer uniform in 3D brain local space
      raycaster.setFromCamera(mouseNDC, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);
      brainGroup.worldToLocal(intersection);

      brainMaterial.uniforms.uPointer.value.copy(intersection);
      brainMaterial.uniforms.uPointerActive.value = 1.0;
    };

    const onPointerDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      // Trigger action potential burst
      brainMaterial.uniforms.uActionPotential.value = 2.4;
      lineMat.opacity = 0.55;
      setIsFiringActionPotential(true);
      setTimeout(() => {
        brainMaterial.uniforms.uActionPotential.value = 1.0;
        lineMat.opacity = 0.25;
        setIsFiringActionPotential(false);
      }, 700);
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onPointerLeave = () => {
      isDragging = false;
      brainMaterial.uniforms.uPointerActive.value = 0;
      targetRotation.y = 0.45;
      targetRotation.x = 0.15;
    };

    container.addEventListener("mousemove", onPointerMove);
    container.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mouseup", onPointerUp);
    container.addEventListener("mouseleave", onPointerLeave);

    // Responsive resize observer
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth || 400;
      const height = container.clientHeight || 400;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      brainMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      brainMaterial.uniforms.uTime.value = elapsed;

      // Auto rotation & smooth damping
      if (autoRotate && !isDragging && !reducedMotion) {
        targetRotation.y += rotationSpeed * 0.008;
      }

      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.06;
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.06;

      brainGroup.rotation.x = currentRotation.x;
      brainGroup.rotation.y = currentRotation.y;

      // Floating elevation bob
      if (!reducedMotion) {
        brainGroup.position.y = Math.sin(elapsed * 1.2) * 0.04;
      }

      // Synapse line subtle pulse
      lineMat.opacity = 0.18 + 0.12 * Math.sin(elapsed * 2.0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", onPointerMove);
      container.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mouseup", onPointerUp);
      container.removeEventListener("mouseleave", onPointerLeave);
      geometry.dispose();
      lineGeom.dispose();
      coreGlowGeom.dispose();
      brainMaterial.dispose();
      lineMat.dispose();
      coreGlowMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [particleCount, interactive, autoRotate, rotationSpeed, pulseSpeed]);

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div
        ref={containerRef}
        className="w-full h-full relative cursor-grab active:cursor-grabbing select-none"
        style={{ minHeight: "280px" }}
        title="Interactive 3D Neural Synapse Brain — Drag to rotate, click to fire action potentials"
      />

      {/* Floating HUD status */}
      <div className="absolute bottom-2 flex items-center gap-2 px-3 py-1 rounded-full bg-card/80 backdrop-blur-md border border-border/60 text-[11px] font-medium text-muted-foreground shadow-xs pointer-events-none">
        <Brain className={`w-3.5 h-3.5 ${isFiringActionPotential ? "text-amber-400 animate-pulse" : "text-primary"}`} />
        <span>Dual Cerebral Hemispheres • {isFiringActionPotential ? "Action Potential Fired!" : "Move cursor to interact"}</span>
      </div>
    </div>
  );
};

export default NeuralBrain3D;
