import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";

export interface BinaryOrbitsProps {
  colors?: [string, string];
  backgroundColor?: string;
  mode?: "auto" | "ink" | "light";
  stars?: number;
  starSize?: number;
  sparkle?: number;
  arms?: number;
  twist?: number;
  armStrength?: number;
  dust?: number;
  core?: number;
  coreSize?: number;
  innerVoid?: number;
  thickness?: number;
  tilt?: number;
  roll?: number;
  scale?: number;
  centerX?: number;
  centerY?: number;
  speed?: number;
  twinkle?: number;
  depth?: number;
  glow?: number;
  intensity?: number;
  interactive?: boolean;
  hoverWake?: boolean;
  clickRipple?: boolean;
  wakeStrength?: number;
  rippleStrength?: number;
  hoverBoost?: number;
  paused?: boolean;
  quality?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface BinaryOrbitsHandle {
  ripple: () => void;
  sync: () => void;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

function hexToRgb(hex: string, fallback: [number, number, number] = [1, 1, 1]): [number, number, number] {
  if (typeof hex !== "string") return fallback;
  const str = hex.trim();
  if (str.startsWith("#")) {
    const raw = str.slice(1);
    if (raw.length === 3) {
      return [
        parseInt(raw[0] + raw[0], 16) / 255,
        parseInt(raw[1] + raw[1], 16) / 255,
        parseInt(raw[2] + raw[2], 16) / 255,
      ];
    }
    if (raw.length === 6) {
      return [
        parseInt(raw.slice(0, 2), 16) / 255,
        parseInt(raw.slice(2, 4), 16) / 255,
        parseInt(raw.slice(4, 6), 16) / 255,
      ];
    }
  }
  return fallback;
}

function sRgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToOklab([r, g, b]: [number, number, number]): [number, number, number] {
  const lr = sRgbToLinear(r);
  const lg = sRgbToLinear(g);
  const lb = sRgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const orbitGLSL = `
uniform float uTime;
uniform float uSpin;
uniform float uCoreRadius;
uniform float uArms;
uniform float uTwist;
uniform float uEps;
uniform float uPattern;

float omega(float a) {
  return uSpin / sqrt(a * a + uCoreRadius * uCoreRadius);
}

vec3 orbit(float a, float psi, float bulge, out float phase) {
  float th = psi + omega(a) * uTime;
  phase = uArms * (th + uTwist * log(max(a, 1e-3)) - uPattern * uTime);
  float r = a * (1.0 - uEps * cos(phase) * (1.0 - bulge));
  return vec3(r * cos(th), r * sin(th), th);
}
`;

const simulationFrag = `
precision highp float;
uniform sampler2D uStatic;
uniform sampler2D uState;
uniform vec4 uSegment;
uniform float uGather;
uniform float uDrag;
uniform float uWidth;
uniform float uDecay;
${orbitGLSL}
out vec4 fragColor;

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);
  vec2 offset = texelFetch(uState, cell, 0).xy;
  if (uGather > 0.0) {
    vec4 star = texelFetch(uStatic, cell, 0);
    float phase;
    vec3 at = orbit(star.x, star.y, star.z, phase);
    vec2 radial = vec2(cos(at.z), sin(at.z));
    vec2 tangent = vec2(-radial.y, radial.x);
    vec2 p = at.xy + radial * offset.x + tangent * offset.y;
    vec2 d = uSegment.zw - uSegment.xy;
    float len = length(d);
    vec2 dir = len > 1e-6 ? d / len : vec2(1.0, 0.0);
    float along = clamp(dot(p - uSegment.xy, dir), 0.0, len);
    vec2 n = p - uSegment.xy - dir * along;
    float w = exp(-dot(n, n) / (uWidth * uWidth)) * (1.0 - 0.7 * star.z) * smoothstep(0.05, 0.3, star.x);
    vec2 delta = (dir * uDrag * uWidth - n * uGather) * w;
    offset += vec2(dot(delta, radial), dot(delta, tangent));
  }
  fragColor = vec4(offset * uDecay, 0.0, 1.0);
}
`;

const particleVert = `
in vec4 aOrbit;
in vec4 aTraits;
uniform sampler2D uState;
uniform int uStride;
uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uFocal;
uniform float uDistance;
uniform float uIncline;
uniform float uRoll;
uniform float uPixelRatio;
uniform float uRealTime;
uniform float uDust;
uniform float uCore;
uniform float uVoid;
uniform float uSize;
uniform float uSizeScale;
uniform float uSparkle;
uniform float uTwinkle;
uniform float uBack;
uniform float uEnergy;
uniform float uInk;
uniform vec3 uLabA;
uniform vec3 uLabB;
uniform vec4 uRipples[6];
uniform float uActive;
${orbitGLSL}
out vec3 vColor;
out float vGain;

vec3 labToLinear(vec3 lab) {
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return max(vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  ), 0.0);
}

void main() {
  float a = aOrbit.x;
  float bulge = aTraits.x;
  float phase;
  vec3 at = orbit(a, aOrbit.y, bulge, phase);
  vec2 radial = vec2(cos(at.z), sin(at.z));
  vec2 tangent = vec2(-radial.y, radial.x);
  vec2 offset = texelFetch(uState, ivec2(gl_VertexID % uStride, gl_VertexID / uStride), 0).xy;
  vec3 p = vec3(at.xy + radial * offset.x + tangent * offset.y, aOrbit.z);
  float tidal = smoothstep(0.004, 0.03, length(offset));
  float ring = 0.0;
  if (uActive > 0.5) {
    for (int k = 0; k < 6; k++) {
      vec4 wave = uRipples[k];
      if (wave.w <= 0.0) continue;
      float age = uRealTime - wave.z;
      if (age < 0.0 || age > 7.0) continue;
      vec2 rel = p.xy - wave.xy;
      float rr = length(rel);
      float front = 0.05 + 0.32 * age;
      float width = 0.07 + 0.03 * age;
      float g = (rr - front) / width;
      float band = exp(-g * g);
      float envelope = wave.w * smoothstep(0.0, 0.7, age) * exp(-age / 2.2) * smoothstep(0.03, 0.2, front + length(wave.xy));
      p.xy -= rel / max(rr, 1e-4) * (rr - front) * 0.55 * envelope * band;
      p.z += 0.03 * envelope * band;
      ring += envelope * band;
    }
  }

  float ci = cos(uIncline);
  float si = sin(uIncline);
  vec3 q = vec3(p.x, p.y * ci + p.z * si, -p.y * si + p.z * ci);
  float cr = cos(uRoll);
  float sr = sin(uRoll);
  q.xy = vec2(cr * q.x - sr * q.y, sr * q.x + cr * q.y);
  float depth = uDistance - q.z;
  vec2 screen = uCenter + uFocal * q.xy / depth;

  float mk = uArms * uTwist;
  float crest = (cos(phase) - mk * sin(phase)) / sqrt(1.0 + mk * mk);
  float arm = pow(max(crest, 0.0), 2.0) * (1.0 - bulge);
  float laneCrest = (cos(phase - 0.55) - mk * sin(phase - 0.55)) / sqrt(1.0 + mk * mk);
  float lane = pow(max(laneCrest, 0.0), 8.0) * (1.0 - arm) * (1.0 - bulge) * smoothstep(0.1, 0.3, a);

  float reach = smoothstep(0.02, 0.55, a);
  vec3 tone = labToLinear(mix(uLabB, uLabA, reach));
  vec3 core = labToLinear(vec3(min(uLabB.x * 1.08 + 0.06, 0.98), uLabB.yz * 0.45));
  vec3 color = mix(tone, core, bulge * 0.75);
  vec3 youngColor = labToLinear(vec3(min(uLabB.x * 0.92, 0.9), uLabB.yz * 1.25));
  float young = smoothstep(0.84, 0.97, aTraits.z) * arm;
  float kindled = clamp(tidal * 0.7 + ring * 1.5, 0.0, 0.75) * (1.0 - bulge * 0.7);
  color = mix(color, youngColor, max(young * 0.75, kindled));
  float bright = step(1.0 - uSparkle, aTraits.y) * (1.0 - bulge * 0.6);
  color = mix(color, vec3(1.0, 0.97, 1.0), bright * 0.35);

  float twinkle = 1.0 - uTwinkle * 0.55 * (0.5 + 0.5 * sin(uRealTime * (0.6 + 1.6 * aTraits.w) + aTraits.w * 61.0));
  float body = mix(0.5 + 1.2 * arm + young * 1.4, uCore * 1.1, bulge) * (1.0 + bright * 2.2);
  body *= 1.0 - uDust * 0.8 * lane;
  float edge = 1.0 - smoothstep(0.82, 1.08, a);
  float hollow = smoothstep(uVoid * 0.85, uVoid * 1.15 + 0.01, a);
  float near = clamp(0.5 + 0.5 * q.z / 0.9, 0.0, 1.0);
  float gain = body * edge * hollow * twinkle * mix(uBack, 1.0, near) * (1.0 + uEnergy * 0.15);
  gain *= 1.0 + 0.9 * tidal * (1.0 - bulge * 0.7) + 0.5 * min(ring, 1.0);

  vColor = mix(color, labToLinear(vec3(uLabA.x * 0.62, uLabA.yz * 1.15)), uInk * 0.35);
  vGain = gain;
  float size = uSize * uSizeScale * uPixelRatio * mix(0.6, 1.1, fract(aTraits.y * 7.31)) * (1.0 + bright * 0.7 + young * 0.4);
  gl_PointSize = max(size * uDistance / depth, 1.0);
  gl_Position = vec4(screen / uResolution * 2.0 - 1.0, 0.0, 1.0);
}
`;

const starFrag = `
precision highp float;
uniform float uStarGain;
in vec3 vColor;
in float vGain;
out vec4 fragColor;

void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  float e = (exp(-r2 * 6.0) + 0.25 * exp(-r2 * 2.0)) * vGain * uStarGain;
  fragColor = vec4(vColor * e, e);
}
`;

const quadVert = `
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const downsampleFrag = `
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 fragColor;

void main() {
  vec4 a = texture(uSource, vUv + uTexel * vec2(-1.0, -1.0));
  vec4 b = texture(uSource, vUv + uTexel * vec2(1.0, -1.0));
  vec4 c = texture(uSource, vUv + uTexel * vec2(-1.0, 1.0));
  vec4 d = texture(uSource, vUv + uTexel * vec2(1.0, 1.0));
  fragColor = (a + b + c + d) * 0.125 + texture(uSource, vUv) * 0.5;
}
`;

const upsampleFrag = `
precision highp float;
uniform sampler2D uSource;
uniform sampler2D uBase;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 fragColor;

void main() {
  vec4 sum = texture(uSource, vUv) * 4.0;
  sum += texture(uSource, vUv + uTexel * vec2(-1.0, 0.0)) * 2.0;
  sum += texture(uSource, vUv + uTexel * vec2(1.0, 0.0)) * 2.0;
  sum += texture(uSource, vUv + uTexel * vec2(0.0, -1.0)) * 2.0;
  sum += texture(uSource, vUv + uTexel * vec2(0.0, 1.0)) * 2.0;
  sum += texture(uSource, vUv + uTexel * vec2(-1.0, -1.0));
  sum += texture(uSource, vUv + uTexel * vec2(1.0, -1.0));
  sum += texture(uSource, vUv + uTexel * vec2(-1.0, 1.0));
  sum += texture(uSource, vUv + uTexel * vec2(1.0, 1.0));
  fragColor = texture(uBase, vUv) + sum / 16.0;
}
`;

const compositeFrag = `
precision highp float;
uniform sampler2D uLines;
uniform sampler2D uBloom;
uniform vec3 uBackground;
uniform float uGlow;
uniform float uExposure;
uniform float uMode;
uniform float uGrain;
in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 encode(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

void main() {
  vec4 lines = texture(uLines, vUv);
  vec4 bloom = texture(uBloom, vUv);
  vec3 color;
  if (uMode < 0.5) {
    vec3 light = (lines.rgb + bloom.rgb * uGlow) * uExposure;
    vec3 exposed = 1.0 - exp(-light);
    float peak = max(exposed.r, max(exposed.g, exposed.b));
    exposed = mix(exposed, vec3(peak), smoothstep(0.75, 1.0, peak) * 0.35);
    color = uBackground + (1.0 - uBackground) * exposed;
  } else {
    float energy = lines.a + bloom.a * uGlow * 0.2;
    vec3 hue = (lines.rgb + bloom.rgb * uGlow * 0.2) / max(energy, 1e-4);
    float cover = clamp(1.0 - exp(-energy * uExposure * 1.4), 0.0, 0.94);
    color = mix(uBackground, clamp(hue * 0.8, 0.0, 1.0), cover);
  }
  float grain = hash(gl_FragCoord.xy + uGrain * 311.0) - 0.5;
  fragColor = vec4(encode(color) + grain * (1.2 / 255.0), 1.0);
}
`;

export const BinaryOrbits = forwardRef<BinaryOrbitsHandle, BinaryOrbitsProps>(function BinaryOrbits(
  {
    colors = ["#2dd4bf", "#38bdf8"],
    backgroundColor = "#0A0F1D",
    mode = "auto",
    stars = 42000,
    starSize = 1.6,
    sparkle = 0.5,
    arms = 3,
    twist = 3.5,
    armStrength = 0.5,
    dust = 0.5,
    core = 1,
    coreSize = 0.07,
    innerVoid = 0,
    thickness = 0.02,
    tilt = 58,
    roll = -8,
    scale = 1,
    centerX = 0.5,
    centerY = 0.5,
    speed = 1,
    twinkle = 0.35,
    depth = 0.4,
    glow = 0.48,
    intensity = 1.05,
    interactive = true,
    hoverWake = true,
    clickRipple = true,
    wakeStrength = 1,
    rippleStrength = 1,
    hoverBoost = 0.5,
    paused = false,
    quality = 1,
    className = "",
    style = {},
    children,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<{ ripple: () => void; sync: () => void } | null>(null);

  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const configRef = useRef({
    colors,
    backgroundColor,
    mode,
    stars,
    starSize,
    sparkle,
    arms,
    twist,
    armStrength,
    dust,
    core,
    coreSize,
    innerVoid,
    thickness,
    tilt,
    roll,
    scale,
    centerX,
    centerY,
    speed,
    twinkle,
    depth,
    glow,
    intensity,
    interactive,
    hoverWake,
    clickRipple,
    wakeStrength,
    rippleStrength,
    hoverBoost,
    paused,
    quality,
    reduced: reducedMotion,
  });

  useEffect(() => {
    configRef.current = {
      colors,
      backgroundColor,
      mode,
      stars,
      starSize,
      sparkle,
      arms,
      twist,
      armStrength,
      dust,
      core,
      coreSize,
      innerVoid,
      thickness,
      tilt,
      roll,
      scale,
      centerX,
      centerY,
      speed,
      twinkle,
      depth,
      glow,
      intensity,
      interactive,
      hoverWake,
      clickRipple,
      wakeStrength,
      rippleStrength,
      hoverBoost,
      paused,
      quality,
      reduced: reducedMotion,
    };
    controllerRef.current?.sync();
  });

  useImperativeHandle(ref, () => ({
    ripple: () => controllerRef.current?.ripple(),
    sync: () => controllerRef.current?.sync(),
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.pointerEvents = "none";
    container.prepend(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      canvas.remove();
      return;
    }

    if (!renderer.capabilities.isWebGL2) {
      renderer.dispose();
      canvas.remove();
      return;
    }

    renderer.autoClear = false;

    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeom = new THREE.PlaneGeometry(2, 2);
    const ripples = Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, -100, 0));

    const commonUniforms = {
      uTime: { value: 0 },
      uSpin: { value: 0.11 },
      uCoreRadius: { value: 0.12 },
      uArms: { value: 3 },
      uTwist: { value: 3.5 },
      uEps: { value: 0.1 },
      uPattern: { value: 0.04 },
    };

    const particleMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        ...commonUniforms,
        uState: { value: null },
        uStride: { value: 512 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uCenter: { value: new THREE.Vector2() },
        uFocal: { value: 1 },
        uDistance: { value: 3.6 },
        uIncline: { value: 1 },
        uRoll: { value: 0 },
        uPixelRatio: { value: 1 },
        uRealTime: { value: 0 },
        uDust: { value: 0.5 },
        uCore: { value: 1 },
        uVoid: { value: 0 },
        uSize: { value: 1.4 },
        uSizeScale: { value: 1 },
        uSparkle: { value: 0.08 },
        uTwinkle: { value: 0.4 },
        uBack: { value: 0.5 },
        uEnergy: { value: 0 },
        uInk: { value: 0 },
        uLabA: { value: new THREE.Vector3() },
        uLabB: { value: new THREE.Vector3() },
        uRipples: { value: ripples },
        uActive: { value: 0 },
        uStarGain: { value: 0.3 },
      },
      vertexShader: particleVert,
      fragmentShader: starFrag,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneFactor,
    });

    const createQuadPass = (frag: string, unifs: Record<string, { value: any }>) =>
      new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        uniforms: unifs,
        vertexShader: quadVert,
        fragmentShader: frag,
        depthTest: false,
        depthWrite: false,
        blending: THREE.NoBlending,
      });

    const simMat = createQuadPass(simulationFrag, {
      ...commonUniforms,
      uStatic: { value: null },
      uState: { value: null },
      uSegment: { value: new THREE.Vector4() },
      uGather: { value: 0 },
      uDrag: { value: 0 },
      uWidth: { value: 0.09 },
      uDecay: { value: 1 },
    });

    const downsampleMat = createQuadPass(downsampleFrag, {
      uSource: { value: null },
      uTexel: { value: new THREE.Vector2() },
    });

    const upsampleMat = createQuadPass(upsampleFrag, {
      uSource: { value: null },
      uBase: { value: null },
      uTexel: { value: new THREE.Vector2() },
    });

    const compositeMat = createQuadPass(compositeFrag, {
      uLines: { value: null },
      uBloom: { value: null },
      uBackground: { value: new THREE.Vector3() },
      uGlow: { value: 0.5 },
      uExposure: { value: 1 },
      uMode: { value: 0 },
      uGrain: { value: 0 },
    });

    const particlePoints = new THREE.Points(new THREE.BufferGeometry(), particleMat);
    particlePoints.frustumCulled = false;
    const particleScene = new THREE.Scene();
    particleScene.add(particlePoints);

    const quadMesh = new THREE.Mesh(quadGeom, compositeMat);
    quadMesh.frustumCulled = false;
    const quadScene = new THREE.Scene();
    quadScene.add(quadMesh);

    let geomKey = "";
    let staticTex: THREE.DataTexture | null = null;
    let stateTargets: THREE.WebGLRenderTarget[] = [];
    let stateIdx = 0;

    const createRenderTarget = (w: number, h: number) =>
      new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: false,
      });

    let mainTarget: THREE.WebGLRenderTarget | null = null;
    let downTargets: THREE.WebGLRenderTarget[] = [];
    let upTargets: THREE.WebGLRenderTarget[] = [];
    let isDestroyed = false;
    let animId = 0;
    let lastTime = 0;
    let isVisible = true;
    let simTime = 40;
    let realTime = 0;
    let hoverEnergy = 0;
    let widthPx = 1024;
    let heightPx = 768;
    let pixelRatio = 1;
    let grainOffset = 0;
    let lastWakeTime = -100;

    const pointerState = {
      inside: false,
      disc: null as { x: number; y: number } | null,
      trail: null as { x: number; y: number } | null,
    };

    const disposeTargets = () => {
      mainTarget?.dispose();
      downTargets.forEach((t) => t.dispose());
      upTargets.forEach((t) => t.dispose());
      mainTarget = null;
      downTargets = [];
      upTargets = [];
    };

    const renderPass = (mat: THREE.RawShaderMaterial, target: THREE.WebGLRenderTarget | null) => {
      quadMesh.material = mat;
      renderer.setRenderTarget(target);
      renderer.render(quadScene, quadCamera);
    };

    const rebuildGeometry = () => {
      const cfg = configRef.current;
      const starCount = Math.round(clamp(cfg.stars, 2000, 150000));
      const coreR = clamp(cfg.coreSize, 0.02, 0.3);
      const thk = clamp(cfg.thickness, 0, 0.2);
      const key = `${starCount}|${coreR}|${thk}`;
      if (key === geomKey) return;
      geomKey = key;

      particlePoints.geometry.dispose();
      staticTex?.dispose();
      stateTargets.forEach((t) => t.dispose());

      // Deterministic pseudo-random seed generator
      let seed = 23;
      const rnd = () => {
        seed = (16807 * seed) % 2147483647;
        return seed / 2147483647;
      };
      const gauss = () =>
        Math.sqrt(-2 * Math.log(Math.max(rnd(), 1e-9))) * Math.cos(Math.PI * 2 * rnd());

      const rows = Math.ceil(starCount / 512);
      const orbitData = new Float32Array(8 * starCount);
      const staticData = new Float32Array(512 * rows * 4);

      for (let i = 0; i < starCount; i++) {
        let aVal: number;
        let zVal: number;
        const isCore = rnd() < 0.16;
        if (isCore) {
          aVal = Math.min(
            coreR / Math.sqrt(Math.min(Math.max(rnd(), 1e-4), 0.995) ** (-2 / 3) - 1),
            4 * coreR
          );
          zVal = gauss() * aVal * 0.5;
        } else {
          do {
            aVal = -0.32 * Math.log(Math.max(rnd() * rnd(), 1e-9));
          } while (aVal > 1.08);
          aVal = Math.max(aVal, 0.012);
          zVal = gauss() * thk * (0.5 + 0.5 * Math.exp(-aVal / 0.25));
        }

        const psi = rnd() * Math.PI * 2;
        orbitData.set([aVal, psi, zVal, rnd(), +!!isCore, rnd(), rnd(), rnd()], 8 * i);
        staticData.set([aVal, psi, +!!isCore, 0], 4 * i);
      }

      const geom = new THREE.BufferGeometry();
      const interBuf = new THREE.InterleavedBuffer(orbitData, 8);
      geom.setAttribute("aOrbit", new THREE.InterleavedBufferAttribute(interBuf, 4, 0));
      geom.setAttribute("aTraits", new THREE.InterleavedBufferAttribute(interBuf, 4, 4));
      geom.setAttribute("position", new THREE.InterleavedBufferAttribute(interBuf, 3, 0));

      const sTex = new THREE.DataTexture(staticData, 512, rows, THREE.RGBAFormat, THREE.FloatType);
      sTex.minFilter = THREE.NearestFilter;
      sTex.magFilter = THREE.NearestFilter;
      sTex.generateMipmaps = false;
      sTex.needsUpdate = true;

      particlePoints.geometry = geom;
      staticTex = sTex;

      stateTargets = [0, 1].map(
        () =>
          new THREE.WebGLRenderTarget(512, rows, {
            type: THREE.HalfFloatType,
            format: THREE.RGBAFormat,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            depthBuffer: false,
            stencilBuffer: false,
            generateMipmaps: false,
          })
      );
      stateIdx = 0;

      for (const t of stateTargets) {
        renderer.setRenderTarget(t);
        renderer.setClearColor(0, 0);
        renderer.clear();
      }

      simMat.uniforms.uStatic.value = staticTex;
      particleMat.uniforms.uState.value = stateTargets[0].texture;
    };

    const getCameraParams = () => {
      const cfg = configRef.current;
      const w = widthPx * pixelRatio;
      const h = heightPx * pixelRatio;
      const focalDist =
        0.36 * clamp(cfg.scale, 0.2, 4) * Math.min(w, 1.7 * h);
      return {
        incline: (clamp(cfg.tilt, 0, 85) * Math.PI) / 180,
        roll: (clamp(cfg.roll, -180, 180) * Math.PI) / 180,
        focal: 3.6 * focalDist,
        center: [
          clamp(cfg.centerX, -0.5, 1.5) * w,
          (1 - clamp(cfg.centerY, -0.5, 1.5)) * h,
        ],
      };
    };

    const screenToDisc = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      const cam = getCameraParams();
      const sx = (clientX - rect.left) * pixelRatio;
      const sy = (rect.height - (clientY - rect.top)) * pixelRatio;
      const xNorm = (sx - cam.center[0]) / cam.focal;
      const yNorm = (sy - cam.center[1]) / cam.focal;
      const cosR = Math.cos(cam.roll);
      const sinR = Math.sin(cam.roll);
      const rotY = -sinR * xNorm + cosR * yNorm;
      const cosI = Math.cos(cam.incline);
      const sinI = Math.sin(cam.incline);
      const den = cosI - rotY * sinI;
      if (den <= 0.02) return null;
      const discY = (3.6 * rotY) / den;
      return {
        x: (cosR * xNorm + sinR * yNorm) * (3.6 + discY * sinI),
        y: discY,
      };
    };

    const triggerRipple = (x = 0, y = 0) => {
      const cfg = configRef.current;
      if (cfg.reduced || cfg.paused) return;
      const str = clamp(cfg.rippleStrength, 0, 3);
      let oldestIdx = 0;
      let newestIdx = 0;
      for (let i = 1; i < 6; i++) {
        if (ripples[i].z > ripples[newestIdx].z) newestIdx = i;
        if (ripples[i].z < ripples[oldestIdx].z) oldestIdx = i;
      }
      const newest = ripples[newestIdx];
      if (
        newest.w > 0 &&
        realTime - newest.z < 0.35 &&
        Math.hypot(newest.x - x, newest.y - y) < 0.15
      ) {
        newest.w = Math.min(newest.w + 0.3 * str, 1.6 * str);
      } else if (realTime - ripples[oldestIdx].z > 7) {
        ripples[oldestIdx].set(x, y, realTime, str);
      } else {
        newest.w = Math.min(newest.w + 0.25 * str, 1.6 * str);
      }
      wakeLoop();
    };

    const hasActiveRipples = () => ripples.some((r) => r.w > 0 && realTime - r.z < 7);

    const renderGalaxy = () => {
      if (!mainTarget || !downTargets.length) return;
      rebuildGeometry();

      const cfg = configRef.current;
      const pUnis = particleMat.uniforms;
      const w = widthPx * pixelRatio;
      const h = heightPx * pixelRatio;
      const cam = getCameraParams();

      const bgRgb = hexToRgb(cfg.backgroundColor, [0.04, 0.04, 0.04]);
      const luma = 0.2126 * bgRgb[0] + 0.7152 * bgRgb[1] + 0.0722 * bgRgb[2];
      const isInk = cfg.mode === "ink" || (cfg.mode === "auto" && luma > 0.5);

      const colA = rgbToOklab(hexToRgb(cfg.colors[0], [0.18, 0.83, 0.75]));
      const colB = rgbToOklab(hexToRgb(cfg.colors[1], [0.22, 0.74, 0.97]));

      const numArms = Math.round(clamp(cfg.arms, 1, 8));
      const armTwist = clamp(cfg.twist, 0.5, 8);
      const str = clamp(cfg.armStrength, 0, 1);

      pUnis.uResolution.value.set(w, h);
      pUnis.uCenter.value.set(cam.center[0], cam.center[1]);
      pUnis.uFocal.value = cam.focal;
      pUnis.uIncline.value = cam.incline;
      pUnis.uRoll.value = cam.roll;
      pUnis.uPixelRatio.value = pixelRatio;
      commonUniforms.uTime.value = simTime;
      pUnis.uRealTime.value = realTime;
      commonUniforms.uArms.value = numArms;
      commonUniforms.uTwist.value = armTwist;
      commonUniforms.uEps.value =
        (0.92 * str) / Math.sqrt(1 + numArms * numArms * armTwist * armTwist);

      pUnis.uDust.value = clamp(cfg.dust, 0, 1);
      pUnis.uCore.value = clamp(cfg.core, 0, 3);
      pUnis.uVoid.value = clamp(cfg.innerVoid, 0, 0.6);
      pUnis.uSize.value = clamp(cfg.starSize, 0.3, 6);
      pUnis.uSparkle.value = 0.2 * clamp(cfg.sparkle, 0, 1);
      pUnis.uTwinkle.value = cfg.reduced ? 0 : clamp(cfg.twinkle, 0, 1);
      pUnis.uBack.value = 1 - clamp(cfg.depth, 0, 1);
      pUnis.uEnergy.value = hoverEnergy;
      pUnis.uInk.value = +!!isInk;
      pUnis.uLabA.value.set(colA[0], colA[1], colA[2]);
      pUnis.uLabB.value.set(colB[0], colB[1], colB[2]);
      pUnis.uActive.value = +!!hasActiveRipples();

      const starCount = Math.round(clamp(cfg.stars, 2000, 150000));
      const factor = (cam.focal / 3.6 / pixelRatio / 380) ** 2;
      const countScale = clamp(factor, 0.2, 1);
      const starScale = clamp(factor ** 0.25, 0.9, 1.22);

      particlePoints.geometry.setDrawRange(0, Math.round(starCount * countScale));
      pUnis.uSizeScale.value = starScale;
      pUnis.uStarGain.value =
        0.3 *
        Math.sqrt(60000 / starCount) *
        clamp(factor / (countScale * starScale * starScale), 0.5, 1.5);

      const cUnis = compositeMat.uniforms;
      cUnis.uBackground.value.set(
        sRgbToLinear(bgRgb[0]),
        sRgbToLinear(bgRgb[1]),
        sRgbToLinear(bgRgb[2])
      );
      cUnis.uGlow.value = clamp(cfg.glow, 0, 3);
      cUnis.uExposure.value =
        (isInk ? 4.5 : 1) * clamp(cfg.intensity, 0, 4) * (1 + 0.08 * hoverEnergy);
      cUnis.uMode.value = +!!isInk;
      cUnis.uGrain.value = grainOffset;

      // 1. Render particles to main off-screen buffer
      renderer.setRenderTarget(mainTarget);
      renderer.setClearColor(0, 0);
      renderer.clear();
      renderer.render(particleScene, quadCamera);

      // 2. Downsample bloom passes
      let cur = mainTarget;
      for (const dt of downTargets) {
        downsampleMat.uniforms.uSource.value = cur.texture;
        downsampleMat.uniforms.uTexel.value.set(1 / cur.width, 1 / cur.height);
        renderPass(downsampleMat, dt);
        cur = dt;
      }

      // 3. Upsample bloom passes
      let upCur = downTargets[downTargets.length - 1];
      for (let i = downTargets.length - 2; i >= 0; i--) {
        upsampleMat.uniforms.uSource.value = upCur.texture;
        upsampleMat.uniforms.uBase.value = downTargets[i].texture;
        upsampleMat.uniforms.uTexel.value.set(1 / upCur.width, 1 / upCur.height);
        renderPass(upsampleMat, upTargets[i]);
        upCur = upTargets[i];
      }

      // 4. Composite bloom with tone mapping onto canvas
      compositeMat.uniforms.uLines.value = mainTarget.texture;
      compositeMat.uniforms.uBloom.value = upCur.texture;
      renderPass(compositeMat, null);
    };

    const getTargetHoverBoost = () => {
      const cfg = configRef.current;
      return pointerState.inside && cfg.interactive && !cfg.reduced
        ? clamp(cfg.hoverBoost, 0, 2)
        : 0;
    };

    const updatePhysics = (dt: number) => {
      const cfg = configRef.current;
      if (!stateTargets.length || cfg.paused || cfg.reduced || dt <= 0) return;

      let gather = 0;
      let drag = 0;
      const trail = pointerState.trail;
      const disc = pointerState.disc;
      const sUnis = simMat.uniforms;

      if (pointerState.inside && cfg.interactive && cfg.hoverWake && trail && disc) {
        const dist = Math.hypot(disc.x - trail.x, disc.y - trail.y);
        if (dist > 1e-5) {
          const norm = clamp((dist / Math.max(dt, 1 / 240) - 0.05) / 1.15, 0, 1);
          gather =
            0.9 *
            clamp(cfg.wakeStrength, 0, 3) *
            norm *
            norm *
            (3 - 2 * norm) *
            (dist / (dist + 0.15948));
          drag = 0.25 * gather;
          sUnis.uSegment.value.set(trail.x, trail.y, disc.x, disc.y);
          if (gather > 0) lastWakeTime = realTime;
        }
      }

      pointerState.trail = disc ? { x: disc.x, y: disc.y } : null;

      if (gather > 0 || realTime - lastWakeTime <= 24.5) {
        sUnis.uGather.value = gather;
        sUnis.uDrag.value = drag;
        sUnis.uDecay.value = Math.exp(-dt / 3.5);
        sUnis.uState.value = stateTargets[stateIdx].texture;
        commonUniforms.uTime.value = simTime;

        renderPass(simMat, stateTargets[1 - stateIdx]);
        stateIdx = 1 - stateIdx;
        particleMat.uniforms.uState.value = stateTargets[stateIdx].texture;
      }
    };

    const frameLoop = (timeNow: number) => {
      animId = 0;
      if (isDestroyed) return;

      const dt = Math.min(0.05, Math.max(0, (timeNow - lastTime) / 1000));
      lastTime = timeNow;
      const cfg = configRef.current;

      hoverEnergy += (getTargetHoverBoost() - hoverEnergy) * (1 - Math.exp(-dt / 0.5));

      if (!cfg.paused && !cfg.reduced) {
        realTime += dt;
        simTime += dt * clamp(cfg.speed, -4, 4) * (1 + 0.25 * hoverEnergy);
        grainOffset = (grainOffset + 0.618034) % 1;
      }

      rebuildGeometry();
      updatePhysics(dt);
      renderGalaxy();

      const shouldAnimate = !cfg.paused && !cfg.reduced;
      const needsCatchup =
        Math.abs(hoverEnergy - getTargetHoverBoost()) > 0.002 ||
        hasActiveRipples() ||
        realTime - lastWakeTime < 24.5;

      if (isVisible && !document.hidden && (shouldAnimate || needsCatchup)) {
        animId = requestAnimationFrame(frameLoop);
      }
    };

    function wakeLoop() {
      if (!isDestroyed && !animId && isVisible) {
        lastTime = performance.now();
        animId = requestAnimationFrame(frameLoop);
      }
    }

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width > 50 ? rect.width : window.innerWidth || 1024;
      const h = rect.height > 50 ? rect.height : window.innerHeight || 768;
      widthPx = Math.max(1, w);
      heightPx = Math.max(1, h);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2) * clamp(configRef.current.quality, 0.25, 1);

      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(widthPx, heightPx, false);

      const rw = Math.round(widthPx * pixelRatio);
      const rh = Math.round(heightPx * pixelRatio);

      disposeTargets();
      mainTarget = createRenderTarget(rw, rh);

      const passes = clamp(Math.floor(Math.log2(Math.min(rw, rh) / 8)), 3, 7);
      for (let i = 1; i <= passes; i++) {
        downTargets.push(createRenderTarget(Math.max(1, rw >> i), Math.max(1, rh >> i)));
        upTargets.push(createRenderTarget(Math.max(1, rw >> i), Math.max(1, rh >> i)));
      }

      renderGalaxy();
      wakeLoop();
    };

    const handlePointerMove = (e: PointerEvent) => {
      const cfg = configRef.current;
      if (e.pointerType === "touch" || !cfg.interactive) return;
      if (!pointerState.inside) {
        pointerState.inside = true;
        pointerState.trail = null;
        wakeLoop();
      }
      const disc = screenToDisc(e.clientX, e.clientY);
      pointerState.disc = disc && Math.hypot(disc.x, disc.y) < 1.6 ? disc : null;
      if (!pointerState.disc) pointerState.trail = null;
      wakeLoop();
    };

    const handlePointerLeave = () => {
      pointerState.inside = false;
      pointerState.disc = null;
      pointerState.trail = null;
      wakeLoop();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const cfg = configRef.current;
      if (e.button !== 0 || !cfg.interactive || !cfg.clickRipple) return;
      const disc = screenToDisc(e.clientX, e.clientY);
      const hit = disc && Math.hypot(disc.x, disc.y) < 1.2;
      triggerRipple(hit ? disc.x : 0, hit ? disc.y : 0);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("pointercancel", handlePointerLeave);
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) wakeLoop();
      },
      { rootMargin: "80px" }
    );
    intersectionObserver.observe(container);

    const handleVisibility = () => {
      if (!document.hidden) wakeLoop();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    handleResize();

    controllerRef.current = {
      sync: () => {
        const pr = Math.min(window.devicePixelRatio || 1, 2) * clamp(configRef.current.quality, 0.25, 1);
        if (Math.abs(pr - pixelRatio) > 0.001) {
          handleResize();
        } else {
          renderGalaxy();
        }
        wakeLoop();
      },
      ripple: () => triggerRipple(0, 0),
    };

    return () => {
      isDestroyed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("pointercancel", handlePointerLeave);
      window.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("visibilitychange", handleVisibility);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      disposeTargets();
      particlePoints.geometry.dispose();
      staticTex?.dispose();
      stateTargets.forEach((t) => t.dispose());
      quadGeom.dispose();
      [particleMat, simMat, downsampleMat, upsampleMat, compositeMat].forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative isolate h-full min-h-[240px] w-full overflow-hidden ${className}`}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "240px",
        overflow: "hidden",
        backgroundColor,
        ...style,
      }}
    >
      {children && (
        <div style={{ position: "relative", zIndex: 10, width: "100%", height: "100%" }}>
          {children}
        </div>
      )}
    </div>
  );
});

export default BinaryOrbits;
