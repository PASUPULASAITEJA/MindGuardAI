import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Brain, Sparkles, Activity } from "lucide-react";

export interface NeuralBrain3DProps {
  className?: string;
  particleCount?: number;
  interactive?: boolean;
  autoRotate?: boolean;
  rotationSpeed?: number;
  glowIntensity?: number;
  pulseSpeed?: number;
  themeMode?: "dark" | "light";
}

/**
 * Generates an anatomically accurate 3D point cloud and synaptic network of the human brain:
 * - Dual cerebral hemispheres (Frontal, Parietal, Occipital, Temporal lobes)
 * - Cortical gyri and sulci convolutions
 * - Cerebellum with horizontal folia striations
 * - Brainstem with descending spinal filaments
 * - Golden synaptic active nodes & connecting axon paths
 * - Surrounding cosmic bokeh sparks
 */
function generateAnatomicalBrain(count: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const traits = new Float32Array(count * 4); // [hemi, region, randPhase, isGold]

  let seed = 1337;
  const rnd = () => {
    seed = (16807 * seed) % 2147483647;
    return seed / 2147483647;
  };
  const gauss = () =>
    Math.sqrt(-2 * Math.log(Math.max(rnd(), 1e-9))) * Math.cos(Math.PI * 2 * rnd());

  // Holographic palette matching the reference images
  const cyanColor = new THREE.Color("#38BDF8");      // Electric Cyan
  const tealColor = new THREE.Color("#2DD4BF");      // Vibrant Teal
  const violetColor = new THREE.Color("#C084FC");    // Holographic Violet
  const goldColor = new THREE.Color("#FBBF24");      // Golden Action Potential Spark
  const amberColor = new THREE.Color("#F59E0B");     // Amber Synaptic Firing

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const i4 = i * 4;
    const hemi = rnd() < 0.5 ? -1 : 1;
    const regChoice = rnd();

    let x = 0;
    let y = 0;
    let z = 0;
    let region = 0; // 0: cortex, 1: cerebellum, 2: brainstem, 3: rootlet, 4: ambient
    let isGold = rnd() < 0.045 ? 1.0 : 0.0; // ~4.5% of points are glowing golden synaptic sparks

    if (regChoice < 0.76) {
      // 1. CEREBRAL CORTEX (Frontal, Parietal, Occipital, Temporal lobes)
      region = 0;
      const u = rnd();
      const v = rnd();
      const theta = u * Math.PI;
      const phi = v * Math.PI * 2;

      // Ellipsoidal anatomical proportions
      const rx = 0.78;
      const ry = 0.92;
      const rz = 1.18;

      // Complex gyri & sulci convolutions (anatomical cortical folding)
      const gyri =
        0.09 * Math.sin(8 * theta) * Math.cos(7 * phi) +
        0.05 * Math.sin(15 * theta + 4 * phi) +
        0.035 * Math.cos(22 * phi) +
        0.02 * Math.sin(28 * theta);

      const depth = Math.cbrt(rnd());
      const rad = (0.76 + 0.24 * depth) * (1.0 + gyri);

      x = hemi * (0.13 + rx * rad * Math.sin(theta) * Math.cos(phi) * 0.88);
      y = ry * rad * Math.cos(theta) * 0.94;
      z = rz * rad * Math.sin(theta) * Math.sin(phi);

      // Distinct longitudinal medial fissure
      if (Math.abs(x) < 0.15) {
        x = hemi * (0.12 + Math.abs(x) * 0.32);
      }

      // Anterior temporal lobe protrusion & Sylvian fissure indentation
      if (y < -0.06 && z > -0.25 && z < 0.42) {
        x *= 1.15;
      }
      // Occipital lobe posterior curvature
      if (z < -0.6) {
        y *= 0.92;
      }
    } else if (regChoice < 0.90) {
      // 2. CEREBELLUM (Posterior lower lobes with horizontal folia striations)
      region = 1;
      const u = rnd();
      const v = rnd();
      const theta = u * Math.PI;
      const phi = v * Math.PI * 2;

      const folia = 0.04 * Math.sin(theta * 32.0); // Distinct horizontal folia lines
      const rad = 0.38 * (0.6 + 0.4 * Math.cbrt(rnd())) * (1.0 + folia);

      x = hemi * 0.34 + rad * Math.sin(theta) * Math.cos(phi) * 0.86;
      y = -0.48 + rad * Math.cos(theta) * 0.72;
      z = -0.58 + rad * Math.sin(theta) * Math.sin(phi) * 0.82;
    } else if (regChoice < 0.96) {
      // 3. BRAINSTEM (Pons & Medulla oblongata descending downward)
      region = 2;
      const t = rnd();
      const r = 0.11 * (0.4 + 0.6 * Math.sqrt(rnd()));
      const ang = rnd() * Math.PI * 2;

      x = r * Math.cos(ang);
      y = -0.44 - t * 0.52;
      z = -0.16 - t * 0.12 + r * Math.sin(ang);
    } else {
      // 4. DESCENDING SPINAL NERVE ROOTLET FILAMENTS (as seen in Reference Image 1)
      region = 3;
      const t = rnd();
      const rootHemi = rnd() < 0.5 ? -1 : 1;
      const spread = 0.08 + t * 0.18;
      const ang = rnd() * Math.PI * 2;

      x = rootHemi * (0.04 + spread * 0.8 * Math.cos(ang));
      y = -0.85 - t * 0.45 + 0.04 * Math.sin(t * 12.0);
      z = -0.22 - t * 0.15 + spread * 0.8 * Math.sin(ang);
      if (rnd() < 0.15) isGold = 1.0;
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    // Vertex color synthesis
    let col: THREE.Color;
    if (isGold > 0.5) {
      col = rnd() < 0.6 ? goldColor.clone() : amberColor.clone();
    } else if (region === 1) {
      col = tealColor.clone().lerp(cyanColor, rnd() * 0.5);
    } else if (region >= 2) {
      col = cyanColor.clone().lerp(tealColor, (y + 1.2) * 0.4);
    } else {
      // Left hemisphere leans electric cyan, right leans holographic violet
      col =
        hemi < 0
          ? cyanColor.clone().lerp(tealColor, (y + 0.8) * 0.3)
          : violetColor.clone().lerp(cyanColor, (y + 0.8) * 0.3);
    }

    colors[i3] = col.r;
    colors[i3 + 1] = col.g;
    colors[i3 + 2] = col.b;

    traits[i4] = hemi;
    traits[i4 + 1] = region;
    traits[i4 + 2] = rnd(); // phase
    traits[i4 + 3] = isGold;
  }

  return { positions, colors, traits };
}

/**
 * Generates synaptic axon connector lines connecting neighboring neurons
 */
function generateSynapseLines(positions: Float32Array, count: number, maxLines: number = 950) {
  const linePositions: number[] = [];
  const lineColors: number[] = [];
  const stride = 14;

  const cyan = new THREE.Color("#38BDF8");
  const gold = new THREE.Color("#FBBF24");
  const violet = new THREE.Color("#C084FC");

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

      // Connect if within synaptic dendritic radius and same hemisphere
      if (distSq < 0.048 && distSq > 0.004) {
        linePositions.push(x1, y1, z1, x2, y2, z2);
        const col = (i + j) % 7 === 0 ? gold : (x1 < 0 ? cyan : violet);
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
 * Generates floating cosmic bokeh sparks orbiting the brain (as in Reference Image 1)
 */
function generateAmbientSparks(count: number = 450) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const traits = new Float32Array(count * 2); // [speed, phase]

  const gold = new THREE.Color("#FBBF24");
  const cyan = new THREE.Color("#38BDF8");

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const r = 1.3 + Math.random() * 1.5;
    const theta = Math.random() * Math.PI;
    const phi = Math.random() * Math.PI * 2;

    positions[i3] = r * Math.sin(theta) * Math.cos(phi);
    positions[i3 + 1] = r * Math.cos(theta) * 0.9;
    positions[i3 + 2] = r * Math.sin(theta) * Math.sin(phi);

    const col = Math.random() < 0.35 ? gold : cyan;
    colors[i3] = col.r;
    colors[i3 + 1] = col.g;
    colors[i3 + 2] = col.b;

    traits[i * 2] = 0.5 + Math.random() * 1.5; // speed
    traits[i * 2 + 1] = Math.random() * Math.PI * 2; // phase
  }

  return { positions, colors, traits };
}

/**
 * Vertex Shader for the Holographic Neural Brain
 */
const neuralVertexShader = `
uniform float uTime;
uniform float uPixelRatio;
uniform float uBaseSize;
uniform float uPulseSpeed;
uniform vec3 uPointer;
uniform float uPointerActive;
uniform float uActionBurst;

attribute vec4 aTraits;
attribute vec3 aColor;

varying vec3 vColor;
varying float vGain;
varying float vIsGold;

void main() {
  vec3 p = position;
  float hemi = aTraits.x;
  float region = aTraits.y;
  float randPhase = aTraits.z;
  float isGold = aTraits.w;

  // 1. Cognitive Breathing Rhythm (alpha/theta brainwave pulsation ~0.2Hz)
  float breath = sin(uTime * uPulseSpeed * 1.4 + randPhase * 0.4) * 0.032;
  p *= 1.0 + breath;

  // 2. Action Potential Wavefront (signal racing from frontal to occipital lobe)
  float waveFront = fract(uTime * 0.32 + randPhase * 0.12);
  float waveDist = abs(p.z * 0.42 + p.y * 0.35 - (waveFront * 2.2 - 1.1));
  float actionPulse = smoothstep(0.18, 0.0, waveDist) * (1.0 + uActionBurst * 2.0);

  // 3. Pointer Local Neural Excitement
  float cursorDist = length(p - uPointer);
  float cursorExcitement = smoothstep(0.72, 0.0, cursorDist) * uPointerActive;

  // Transform to model-view space
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Depth-attenuated particle size
  float sizeMultiplier = isGold > 0.5 ? 1.7 : 1.0;
  float pSize = uBaseSize * uPixelRatio * (2.85 / -mvPosition.z) * sizeMultiplier;
  pSize *= 1.0 + actionPulse * 1.4 + cursorExcitement * 2.0;
  gl_PointSize = clamp(pSize, 1.5, 26.0);

  // Dynamic color illumination
  vec3 col = aColor;
  if (isGold > 0.5) {
    col = mix(col, vec3(1.0, 0.95, 0.7), actionPulse * 0.7);
  } else {
    vec3 flashCol = hemi < 0.0 ? vec3(0.5, 0.98, 1.0) : vec3(0.95, 0.65, 1.0);
    col = mix(col, flashCol, actionPulse * 0.75 + cursorExcitement * 0.6);
  }
  col += vec3(1.0, 1.0, 1.0) * (actionPulse * 0.35 + cursorExcitement * 0.45);

  // Basal synaptic twinkle
  float twinkle = 0.82 + 0.18 * sin(uTime * 3.5 + randPhase * 6.28);

  vColor = col;
  vGain = (0.78 + actionPulse * 1.35 + cursorExcitement * 1.6) * twinkle;
  vIsGold = isGold;
}
`;

/**
 * Fragment Shader for Holographic Soft Gaussian Bloom
 */
const neuralFragmentShader = `
precision highp float;

varying vec3 vColor;
varying float vGain;
varying float vIsGold;

void main() {
  vec2 coord = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(coord, coord);
  if (r2 > 1.0) discard;

  // Multi-tier Gaussian nucleus + soft corona
  float core = exp(-r2 * (vIsGold > 0.5 ? 9.0 : 7.0));
  float corona = exp(-r2 * 2.2) * (vIsGold > 0.5 ? 0.6 : 0.4);
  float alpha = (core * 1.4 + corona) * vGain;

  gl_FragColor = vec4(vColor * (core * 1.5 + corona), clamp(alpha, 0.0, 1.0));
}
`;

export const NeuralBrain3D: React.FC<NeuralBrain3DProps> = ({
  className = "",
  particleCount = 18000,
  interactive = true,
  autoRotate = true,
  rotationSpeed = 0.32,
  pulseSpeed = 1.0,
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

    // Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    // Positioned for elegant 3/4 anatomical view
    camera.position.set(0, 0.25, 3.65);

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
    // Default lateral 3/4 tilt matching reference images
    brainGroup.rotation.x = 0.18;
    brainGroup.rotation.y = 0.48;
    scene.add(brainGroup);

    // 1. High-Density Anatomical Point Cloud
    const brainData = generateAnatomicalBrain(particleCount);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(brainData.positions, 3));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(brainData.colors, 3));
    geometry.setAttribute("aTraits", new THREE.BufferAttribute(brainData.traits, 4));

    const brainMaterial = new THREE.ShaderMaterial({
      vertexShader: neuralVertexShader,
      fragmentShader: neuralFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uBaseSize: { value: 2.3 },
        uPulseSpeed: { value: pulseSpeed },
        uPointer: { value: new THREE.Vector3(100, 100, 100) },
        uPointerActive: { value: 0 },
        uActionBurst: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, brainMaterial);
    brainGroup.add(particles);

    // 2. Synaptic Axon Fiber Lines
    const synapseData = generateSynapseLines(brainData.positions, particleCount, 950);
    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute("position", new THREE.BufferAttribute(synapseData.positions, 3));
    lineGeom.setAttribute("color", new THREE.BufferAttribute(synapseData.colors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
    });
    const synapseLines = new THREE.LineSegments(lineGeom, lineMat);
    brainGroup.add(synapseLines);

    // 3. Ambient Cosmic Bokeh Sparks Orbiting Brain
    const sparkData = generateAmbientSparks(380);
    const sparkGeom = new THREE.BufferGeometry();
    sparkGeom.setAttribute("position", new THREE.BufferAttribute(sparkData.positions, 3));
    sparkGeom.setAttribute("color", new THREE.BufferAttribute(sparkData.colors, 3));

    const sparkMat = new THREE.PointsMaterial({
      size: 0.038,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const sparkPoints = new THREE.Points(sparkGeom, sparkMat);
    brainGroup.add(sparkPoints);

    // 4. Central Atmospheric Bloom Core
    const innerBloomGeom = new THREE.SphereGeometry(0.42, 16, 16);
    const innerBloomMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#0284C7"),
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
    });
    const innerBloom = new THREE.Mesh(innerBloomGeom, innerBloomMat);
    brainGroup.add(innerBloom);

    // Pointer Interactivity & Rotation Physics
    const targetRotation = { x: 0.18, y: 0.48 };
    const currentRotation = { x: 0.18, y: 0.48 };
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
        targetRotation.y += deltaX * 0.0075;
        targetRotation.x += deltaY * 0.0075;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        // Smooth parallax gaze
        targetRotation.y = 0.48 + x * 0.65;
        targetRotation.x = 0.18 - y * 0.45;
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
      brainMaterial.uniforms.uActionBurst.value = 1.8;
      lineMat.opacity = 0.68;
      setIsFiringBurst(true);
      setTimeout(() => {
        brainMaterial.uniforms.uActionBurst.value = 0;
        lineMat.opacity = 0.28;
        setIsFiringBurst(false);
      }, 750);
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
      targetRotation.y = 0.48;
      targetRotation.x = 0.18;
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

      // Gentle auto-rotation
      if (autoRotate && !isDragging && !reducedMotion) {
        targetRotation.y += rotationSpeed * 0.007;
      }

      currentRotation.x += (targetRotation.x - currentRotation.x) * 0.055;
      currentRotation.y += (targetRotation.y - currentRotation.y) * 0.055;

      brainGroup.rotation.x = currentRotation.x;
      brainGroup.rotation.y = currentRotation.y;

      // Subtle atmospheric elevation float
      if (!reducedMotion) {
        brainGroup.position.y = Math.sin(elapsed * 1.1) * 0.045;
        sparkPoints.rotation.y = elapsed * 0.04;
      }

      // Synapse line rhythmic breathing opacity
      lineMat.opacity = 0.22 + 0.14 * Math.sin(elapsed * 2.2);

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
      sparkGeom.dispose();
      innerBloomGeom.dispose();
      brainMaterial.dispose();
      lineMat.dispose();
      sparkMat.dispose();
      innerBloomMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [particleCount, interactive, autoRotate, rotationSpeed, pulseSpeed]);

  if (!webGlSupported) {
    // Elegant Animated SVG Neural Network Fallback
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full max-w-md animate-pulse"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#2DD4BF" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle cx="200" cy="200" r="140" fill="#0284C7" opacity="0.1" filter="url(#glow)" />
          {/* Animated SVG Neural Branches */}
          <g stroke="url(#brainGrad)" strokeWidth="1.5" opacity="0.75" fill="none">
            <path d="M 120,200 Q 150,140 200,150 T 280,200 T 200,270 Z" />
            <path d="M 140,180 Q 200,120 260,180" />
            <path d="M 140,220 Q 200,280 260,220" />
            <path d="M 170,150 L 230,250" />
            <path d="M 170,250 L 230,150" />
          </g>
          {/* Synaptic Nodes */}
          {[
            [120, 200], [280, 200], [200, 150], [200, 270],
            [160, 170], [240, 170], [160, 230], [240, 230], [200, 200]
          ].map(([cx, cy], idx) => (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={idx % 2 === 0 ? "5" : "3.5"}
              fill={idx % 3 === 0 ? "#FBBF24" : "#38BDF8"}
              filter="url(#glow)"
            />
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* 3D Canvas Host Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative cursor-grab active:cursor-grabbing"
        style={{ minHeight: "360px", minWidth: "300px" }}
        title="Interactive Holographic Neural Brain — Drag to rotate, click to fire action potentials"
      />

      {/* Floating Status Badge */}
      <div className="absolute bottom-3 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/85 backdrop-blur-md border border-border/80 text-[11px] font-medium text-muted-foreground shadow-sm pointer-events-none transition-all">
        <Brain className={`w-3.5 h-3.5 transition-colors ${isFiringBurst ? "text-amber-400 animate-pulse" : "text-primary"}`} />
        <span className="flex items-center gap-1.5">
          <span>Holographic Neural Brain</span>
          <span className="inline-block w-1 h-1 rounded-full bg-border" />
          <span className={isFiringBurst ? "text-amber-400 font-semibold" : "text-primary"}>
            {isFiringBurst ? "Action Potential Fired!" : "18k Synaptic Points"}
          </span>
        </span>
      </div>
    </div>
  );
};

export default NeuralBrain3D;
