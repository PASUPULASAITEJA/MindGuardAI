import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Brain, Zap, Sparkles } from "lucide-react";

export interface NeuralBrain3DProps {
  className?: string;
  particleCount?: number;
  interactive?: boolean;
  autoRotate?: boolean;
  rotationSpeed?: number;
  pulseSpeed?: number;
  showStatusBadge?: boolean;
}

/**
 * Generates an anatomically structured 3D point cloud of the human brain:
 * - Dual cerebral hemispheres separated by the longitudinal fissure
 * - Cortical gyri and sulci convolutions across Frontal, Parietal, Occipital, and Temporal lobes
 * - Sylvian fissure and temporal lobe tuck
 * - Posterior Cerebellum with distinct horizontal folia striations
 * - Descending Brainstem into spinal cord
 * - Active firing synaptic junction nodes (white/golden sparks)
 */
function generateAnatomicalBrainPointCloud(count: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const traits = new Float32Array(count * 4); // [phase, isSynapse, hemi, speed]

  let seed = 42891;
  const rnd = () => {
    seed = (16807 * seed) % 2147483647;
    return seed / 2147483647;
  };

  const cyan = new THREE.Color("#22D3EE");      // Electric cyan
  const teal = new THREE.Color("#2DD4BF");      // Soft healthcare teal
  const sky = new THREE.Color("#38BDF8");       // Vibrant sky blue
  const violet = new THREE.Color("#C084FC");    // Subtle holographic violet
  const white = new THREE.Color("#FFFFFF");     // Hot action potential core
  const gold = new THREE.Color("#FBBF24");      // Golden synaptic spark

  let i = 0;
  let attempts = 0;
  const maxAttempts = count * 6;

  while (i < count && attempts < maxAttempts) {
    attempts++;
    const hemi = rnd() < 0.5 ? -1 : 1;
    const regionChoice = rnd();
    let x = 0;
    let y = 0;
    let z = 0;
    let isSynapse = rnd() < 0.085 ? 1.0 : 0.0;
    let col = cyan.clone();

    if (regionChoice < 0.77) {
      // 1. CEREBRAL CORTEX (Frontal, Parietal, Occipital, Temporal lobes)
      const u = (rnd() - 0.5) * 2; // -1 to 1 (anterior to posterior)
      const v = (rnd() - 0.5) * 2; // -1 to 1 (inferior to superior)

      // Anatomic lateral boundary profile of human cerebrum
      const radSq = (u * 1.14) * (u * 1.14) + (v * 1.26) * (v * 1.26);
      if (radSq > 0.94) continue; // outside cerebrum contour

      // Sylvian fissure indentation between frontal and temporal lobes
      if (u > -0.38 && u < 0.12 && v > -0.28 && v < -0.06 && rnd() < 0.55) {
        continue;
      }

      // Procedural cortical gyri and sulci convolutions
      const sulci =
        0.07 * Math.sin(u * 20.0 + v * 12.0) +
        0.045 * Math.cos(u * 14.0 - v * 24.0) +
        0.025 * Math.sin(u * 32.0);

      const zMax = Math.sqrt(Math.max(0, 1.0 - radSq)) * 0.54 * (1.0 + sulci);

      // Depth distribution: heavier density on outer cortical surface, lighter in white matter
      const depth = Math.pow(rnd(), 0.38);
      z = hemi * (0.055 + zMax * (0.2 + 0.8 * depth));
      x = u * 1.34;
      y = (v + 0.14) * 1.14;

      // Color scheme: Glowing cyan, electric-blue, white, and subtle violet
      if (isSynapse > 0.5) {
        col = rnd() < 0.4 ? gold.clone() : white.clone();
      } else if (hemi < 0) {
        // Left hemisphere: electric cyan & sky blue
        col = rnd() < 0.55 ? cyan.clone() : sky.clone();
        if (rnd() < 0.15) col.lerp(white, 0.4);
      } else {
        // Right hemisphere: cyan with subtle violet accents
        col = rnd() < 0.35 ? violet.clone() : sky.clone();
        if (rnd() < 0.2) col.lerp(teal, 0.35);
      }
    } else if (regionChoice < 0.91) {
      // 2. CEREBELLUM (Posterior lower lobes with distinct horizontal folia)
      const cu = (rnd() - 0.5) * 0.72;
      const cv = (rnd() - 0.5) * 0.52;
      if (cu * cu * 4.2 + cv * cv * 5.4 > 0.52) continue;

      // Horizontal folia striations
      const folia = 0.035 * Math.sin(cv * 68.0);
      const czMax = Math.sqrt(Math.max(0, 0.48 - cu * cu * 4.2 - cv * cv * 5.4)) * 0.46;

      x = 0.44 + cu * 1.12;
      y = -0.42 + cv * 0.88 + folia;
      z = hemi * (0.11 + czMax * (0.25 + 0.75 * rnd()));

      col = isSynapse > 0.5 ? white.clone() : teal.clone().lerp(cyan, rnd() * 0.5);
    } else {
      // 3. BRAINSTEM (Pons and Medulla descending into spinal cord)
      const t = rnd();
      const ang = rnd() * Math.PI * 2;
      const rad = 0.09 * (0.3 + 0.7 * Math.sqrt(rnd()));

      x = 0.14 - t * 0.08 + rad * Math.cos(ang);
      y = -0.46 - t * 0.54;
      z = (rnd() - 0.5) * 0.14 + rad * Math.sin(ang);

      col = isSynapse > 0.5 ? gold.clone() : teal.clone().lerp(sky, 0.4);
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;

    traits[i * 4] = rnd() * Math.PI * 2; // phase
    traits[i * 4 + 1] = isSynapse;
    traits[i * 4 + 2] = hemi;
    traits[i * 4 + 3] = 0.6 + rnd() * 1.4; // oscillation speed

    i++;
  }

  return { positions, colors, traits, actualCount: i };
}

/**
 * Generates synaptic connector axon lines between neighboring cortical neurons
 */
function generateSynapticFibers(positions: Float32Array, count: number, maxFibers = 1100) {
  const linePositions: number[] = [];
  const lineColors: number[] = [];
  const stride = 16;

  const cyan = new THREE.Color("#22D3EE");
  const sky = new THREE.Color("#38BDF8");
  const gold = new THREE.Color("#FBBF24");

  for (let i = 0; i < count; i += stride) {
    const x1 = positions[i * 3];
    const y1 = positions[i * 3 + 1];
    const z1 = positions[i * 3 + 2];

    let connections = 0;
    for (let j = i + stride; j < count; j += stride) {
      if (linePositions.length / 6 >= maxFibers) break;
      const x2 = positions[j * 3];
      const y2 = positions[j * 3 + 1];
      const z2 = positions[j * 3 + 2];

      const dx = x2 - x1;
      const dy = y2 - y1;
      const dz = z2 - z1;
      const distSq = dx * dx + dy * dy + dz * dz;

      // Connect if within dendritic radius and same hemisphere
      if (distSq < 0.046 && distSq > 0.003 && Math.sign(z1) === Math.sign(z2)) {
        linePositions.push(x1, y1, z1, x2, y2, z2);
        const col = (i + j) % 9 === 0 ? gold : (x1 < 0 ? cyan : sky);
        lineColors.push(col.r, col.g, col.b, col.r, col.g, col.b);
        connections++;
        if (connections >= 2) break;
      }
    }
  }

  return {
    positions: new Float32Array(linePositions),
    colors: new Float32Array(lineColors),
  };
}

/**
 * Background particle field (deep space stars & cosmic dust)
 */
function generateCosmicField(count = 2200) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cyan = new THREE.Color("#38BDF8");
  const blue = new THREE.Color("#1E40AF");
  const white = new THREE.Color("#E0F2FE");

  for (let i = 0; i < count; i++) {
    const r = 2.0 + Math.random() * 4.5;
    const theta = Math.random() * Math.PI;
    const phi = Math.random() * Math.PI * 2;

    positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
    positions[i * 3 + 1] = r * Math.cos(theta) * 0.9;
    positions[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi);

    const rndColor = Math.random();
    const col = rndColor < 0.6 ? cyan : rndColor < 0.85 ? blue : white;
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  return { positions, colors };
}

/**
 * Custom GLSL Vertex Shader for the 3D Particle Brain
 */
const brainVertexShader = `
uniform float uTime;
uniform float uPixelRatio;
uniform float uBaseSize;
uniform float uPulseSpeed;
uniform vec3 uPointer;
uniform float uPointerActive;
uniform float uActionShockwave;

attribute vec4 aTraits;
attribute vec3 aColor;

varying vec3 vColor;
varying float vGain;
varying float vIsSynapse;

void main() {
  vec3 p = position;
  float phase = aTraits.x;
  float isSynapse = aTraits.y;
  float hemi = aTraits.z;
  float speed = aTraits.w;

  // 1. Subtle particle oscillations (Brownian surface jitter)
  vec3 osc = vec3(
    sin(uTime * 2.2 * speed + phase) * 0.016,
    cos(uTime * 1.8 * speed + phase * 1.3) * 0.016,
    sin(uTime * 2.5 * speed + phase * 0.7) * 0.016
  );
  p += osc;

  // 2. Cognitive Breathing Rhythm (gentle alpha wave expansion ~0.2Hz)
  float breath = sin(uTime * uPulseSpeed * 1.3 + phase * 0.25) * 0.028;
  p *= 1.0 + breath;

  // 3. Traveling Neural Action Potential Wave (signal races from frontal to occipital lobe)
  float waveFront = fract(uTime * 0.32 + phase * 0.08);
  float waveDist = abs(p.x * 0.45 + p.y * 0.35 - (waveFront * 2.2 - 1.1));
  float neuralPulse = smoothstep(0.18, 0.0, waveDist);

  // 4. Cursor Proximity Excitation
  float cursorDist = length(p - uPointer);
  float cursorExcitement = smoothstep(0.72, 0.0, cursorDist) * uPointerActive;

  // 5. Interactive Click Shockwave
  float shockDist = abs(length(p) - uActionShockwave);
  float shockPulse = smoothstep(0.25, 0.0, shockDist) * (uActionShockwave > 0.01 ? 1.5 : 0.0);

  // Model-view transform
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Depth-attenuated particle size with soft scaling
  float sizeBoost = isSynapse > 0.5 ? 1.8 : 1.0;
  float pSize = uBaseSize * uPixelRatio * (2.85 / -mvPosition.z) * sizeBoost;
  pSize *= 1.0 + neuralPulse * 1.35 + cursorExcitement * 1.8 + shockPulse * 1.6;
  gl_PointSize = clamp(pSize, 1.4, 28.0);

  // Color dynamics: flare with hot white and gold when signals pass through
  vec3 col = aColor;
  vec3 firingCol = isSynapse > 0.5 ? vec3(1.0, 0.96, 0.75) : vec3(0.65, 0.95, 1.0);
  col = mix(col, firingCol, neuralPulse * 0.7 + cursorExcitement * 0.6 + shockPulse * 0.8);
  col += vec3(1.0, 1.0, 1.0) * (neuralPulse * 0.35 + cursorExcitement * 0.45 + shockPulse * 0.6);

  // Independent brightness twinkle
  float twinkle = 0.82 + 0.18 * sin(uTime * 3.6 + phase * 6.28);

  vColor = col;
  vGain = (0.75 + neuralPulse * 1.4 + cursorExcitement * 1.5 + shockPulse * 1.8) * twinkle;
  vIsSynapse = isSynapse;
}
`;

/**
 * Custom GLSL Fragment Shader for Gaussian Core & Luminous Bloom
 */
const brainFragmentShader = `
precision highp float;

varying vec3 vColor;
varying float vGain;
varying float vIsSynapse;

void main() {
  vec2 coord = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(coord, coord);
  if (r2 > 1.0) discard;

  // Soft Gaussian nucleus + glowing radiant corona
  float core = exp(-r2 * (vIsSynapse > 0.5 ? 8.5 : 6.8));
  float corona = exp(-r2 * 2.0) * (vIsSynapse > 0.5 ? 0.65 : 0.42);
  float alpha = (core * 1.5 + corona) * vGain;

  gl_FragColor = vec4(vColor * (core * 1.4 + corona), clamp(alpha, 0.0, 1.0));
}
`;

export const NeuralBrain3D: React.FC<NeuralBrain3DProps> = ({
  className = "",
  particleCount = 28000,
  interactive = true,
  autoRotate = true,
  rotationSpeed = 0.36,
  pulseSpeed = 1.0,
  showStatusBadge = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [isFiringBurst, setIsFiringBurst] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check reduced motion preference
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Responsive particle count (optimize on mobile / smaller viewports)
    const isMobile = window.innerWidth < 768;
    const effectiveCount = isMobile ? Math.min(particleCount, 15000) : particleCount;

    // 1. Scene, Camera & WebGL Renderer Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.18, 3.55);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      setWebGlSupported(false);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth || 440, container.clientHeight || 440);
    container.appendChild(renderer.domElement);

    // Master Brain Group
    const brainGroup = new THREE.Group();
    // Default lateral 3/4 anatomical pitch
    brainGroup.rotation.x = 0.16;
    brainGroup.rotation.y = 0.42;
    scene.add(brainGroup);

    // 2. Anatomical Human Brain Point Cloud
    const brainData = generateAnatomicalBrainPointCloud(effectiveCount);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(brainData.positions.slice(0, brainData.actualCount * 3), 3)
    );
    geometry.setAttribute(
      "aColor",
      new THREE.BufferAttribute(brainData.colors.slice(0, brainData.actualCount * 3), 3)
    );
    geometry.setAttribute(
      "aTraits",
      new THREE.BufferAttribute(brainData.traits.slice(0, brainData.actualCount * 4), 4)
    );

    const brainMaterial = new THREE.ShaderMaterial({
      vertexShader: brainVertexShader,
      fragmentShader: brainFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uBaseSize: { value: isMobile ? 2.1 : 2.4 },
        uPulseSpeed: { value: pulseSpeed },
        uPointer: { value: new THREE.Vector3(100, 100, 100) },
        uPointerActive: { value: 0 },
        uActionShockwave: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const brainPoints = new THREE.Points(geometry, brainMaterial);
    brainGroup.add(brainPoints);

    // 3. Synaptic Connector Axon Fibers
    const fiberData = generateSynapticFibers(brainData.positions, brainData.actualCount, isMobile ? 650 : 1200);
    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute("position", new THREE.BufferAttribute(fiberData.positions, 3));
    lineGeom.setAttribute("color", new THREE.BufferAttribute(fiberData.colors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
    });
    const fiberLines = new THREE.LineSegments(lineGeom, lineMat);
    brainGroup.add(fiberLines);

    // 4. Background Cosmic Star Field (Particles distributed in depth)
    const cosmicData = generateCosmicField(isMobile ? 1200 : 2500);
    const cosmicGeom = new THREE.BufferGeometry();
    cosmicGeom.setAttribute("position", new THREE.BufferAttribute(cosmicData.positions, 3));
    cosmicGeom.setAttribute("color", new THREE.BufferAttribute(cosmicData.colors, 3));

    const cosmicMat = new THREE.PointsMaterial({
      size: 0.032,
      vertexColors: true,
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
    });
    const cosmicPoints = new THREE.Points(cosmicGeom, cosmicMat);
    scene.add(cosmicPoints);

    // 5. Atmospheric Core Glow
    const coreGlowGeom = new THREE.SphereGeometry(0.38, 16, 16);
    const coreGlowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#0284C7"),
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
    });
    const coreGlow = new THREE.Mesh(coreGlowGeom, coreGlowMat);
    brainGroup.add(coreGlow);

    // Pointer Interactivity & 3D Rotation Physics
    const targetRotation = { x: 0.16, y: 0.42 };
    const currentRotation = { x: 0.16, y: 0.42 };
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let shockwaveProgress = 0;
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
        targetRotation.y += deltaX * 0.0075;
        targetRotation.x += deltaY * 0.0075;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        // Smooth parallax gaze
        targetRotation.y = 0.42 + x * 0.65;
        targetRotation.x = 0.16 - y * 0.45;
      }

      // Map 2D pointer into brain's local 3D coordinate space
      raycaster.setFromCamera(mouseNDC, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);
      brainGroup.worldToLocal(intersection);

      brainMaterial.uniforms.uPointer.value.copy(intersection);
      brainMaterial.uniforms.uPointerActive.value = 1.0;
    };

    const triggerActionBurst = () => {
      shockwaveProgress = 0.01;
      lineMat.opacity = 0.65;
      setIsFiringBurst(true);
      setTimeout(() => {
        lineMat.opacity = 0.26;
        setIsFiringBurst(false);
      }, 850);
    };

    const onPointerDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      triggerActionBurst();
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onPointerLeave = () => {
      isDragging = false;
      brainMaterial.uniforms.uPointerActive.value = 0;
      targetRotation.y = 0.42;
      targetRotation.x = 0.16;
    };

    container.addEventListener("mousemove", onPointerMove);
    container.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mouseup", onPointerUp);
    container.addEventListener("mouseleave", onPointerLeave);

    // Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth || 440;
      const height = container.clientHeight || 440;
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

      // Auto rotation with damping
      if (autoRotate && !isDragging && !reducedMotion) {
        targetRotation.y += rotationSpeed * 0.007;
      }

      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.055;
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.055;

      brainGroup.rotation.x = currentRotation.x;
      brainGroup.rotation.y = currentRotation.y;

      // Atmospheric elevation float & cosmic star drift
      if (!reducedMotion) {
        brainGroup.position.y = Math.sin(elapsed * 1.15) * 0.045;
        cosmicPoints.rotation.y = elapsed * 0.025;
        cosmicPoints.rotation.x = Math.sin(elapsed * 0.015) * 0.05;
      }

      // Shockwave burst propagation
      if (shockwaveProgress > 0) {
        shockwaveProgress += 0.055;
        brainMaterial.uniforms.uActionShockwave.value = shockwaveProgress;
        if (shockwaveProgress > 2.2) {
          shockwaveProgress = 0;
          brainMaterial.uniforms.uActionShockwave.value = 0;
        }
      }

      // Synapse line rhythmic breathing opacity
      lineMat.opacity = 0.22 + 0.12 * Math.sin(elapsed * 2.2);

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
      cosmicGeom.dispose();
      coreGlowGeom.dispose();
      brainMaterial.dispose();
      lineMat.dispose();
      cosmicMat.dispose();
      coreGlowMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [particleCount, interactive, autoRotate, rotationSpeed, pulseSpeed]);

  if (!webGlSupported) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="w-full h-full max-w-md flex flex-col items-center justify-center p-6 text-center text-muted-foreground border border-border/60 rounded-2xl bg-card/40">
          <Brain className="w-12 h-12 text-primary animate-pulse mb-3" />
          <p className="text-sm font-semibold text-foreground">3D Neural System Active</p>
          <p className="text-xs mt-1">WebGL hardware acceleration disabled or unsupported.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative cursor-grab active:cursor-grabbing"
        style={{ minHeight: "360px", minWidth: "300px" }}
        title="Interactive 3D Particle Brain • Drag to rotate, click to fire action potentials"
      />

      {/* Floating Status HUD */}
      {showStatusBadge && (
        <div className="absolute -bottom-2 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-card/85 backdrop-blur-md border border-border/80 text-[11px] font-medium text-muted-foreground shadow-md pointer-events-none transition-all">
          <Brain
            className={`w-3.5 h-3.5 transition-colors ${
              isFiringBurst ? "text-amber-400 animate-pulse" : "text-primary"
            }`}
          />
          <span className="flex items-center gap-1.5">
            <span className="text-foreground font-semibold">3D Particle Brain</span>
            <span className="inline-block w-1 h-1 rounded-full bg-border" />
            <span className={isFiringBurst ? "text-amber-400 font-bold" : "text-primary flex items-center gap-1"}>
              <Zap className="w-3 h-3 inline" />
              {isFiringBurst ? "Action Potential Fired!" : "28k Neural Particles"}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default NeuralBrain3D;
