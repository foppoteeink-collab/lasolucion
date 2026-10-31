import React, { useEffect, useRef, useState, useCallback } from 'react';
import './moxenMalla.css';
import { 
  Sparkles, RotateCcw, Copy, Check, Shuffle, Maximize2, Minimize2, 
  Palette, CheckCircle2, Zap, Waves, Flame, Eye, EyeOff, X
} from 'lucide-react';
import { soundFX } from '../../utils/audio';

export interface MoxenMallaPreset {
  id: string;
  name: string;
  badge: string;
  desc: string;
  base: string;
  colors: string[]; // 4 colors (sliced to pointCount)
}

export const MOXEN_MALLA_PRESETS: MoxenMallaPreset[] = [
  {
    id: 'aurora',
    name: 'Aurora Boreal',
    badge: 'AURORA',
    desc: 'Verde Ártico, Cian Neón, Púrpura y Plasma',
    base: '#020d18',
    colors: ['#00ffaa', '#00d0ff', '#7000ff', '#ff00aa']
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neón',
    badge: 'NEÓN',
    desc: 'Cian Cuántico, Ultravioleta, Magenta y Neón Lima',
    base: '#030712',
    colors: ['#00f0ff', '#7000ff', '#ff007f', '#00ff88']
  },
  {
    id: 'nebulosa',
    name: 'Nebulosa Cuántica',
    badge: 'CUÁNTICA',
    desc: 'Azul Cobalto, Lila Cósmico y Durazno Estelar',
    base: '#050b1a',
    colors: ['#2f7bd9', '#7a63e0', '#ff9d78', '#1a2a9c']
  },
  {
    id: 'solar',
    name: 'Furia Solar',
    badge: 'SOLAR',
    desc: 'Plasma Incandescente, Calipso y Fuego Estelar',
    base: '#0a040f',
    colors: ['#ff5500', '#ffa234', '#ff007f', '#00e5ff']
  },
  {
    id: 'abismo',
    name: 'Abismo Índigo (Zen)',
    badge: 'ZEN',
    desc: 'Aguas Abisales, Índigo y Cian Bioluminiscente',
    base: '#02040a',
    colors: ['#0ea5e9', '#6366f1', '#14b8a6', '#3b82f6']
  },
  {
    id: 'matriz',
    name: 'Matriz Esmeralda',
    badge: 'MATRIZ',
    desc: 'Terminal Hacker, Esmeralda y Jade Bioquántico',
    base: '#02140c',
    colors: ['#10b981', '#00ff88', '#059669', '#34d399']
  }
];

export const HUNTER_SWATCHES = [
  { name: 'Cian Neón', hex: '#00f0ff' },
  { name: 'Púrpura Monarca', hex: '#7000ff' },
  { name: 'Furia Magenta', hex: '#ff007f' },
  { name: 'Aurora Esmeralda', hex: '#00ffaa' },
  { name: 'Oro Solar', hex: '#facc15' },
  { name: 'Fuego Plasma', hex: '#ff5500' },
  { name: 'Azul Abisal', hex: '#0099ff' },
  { name: 'Hielo Estelar', hex: '#e0f2fe' },
];

export interface MoxenMallaProps {
  className?: string;
  onApplyToSystem?: (aura: { name: string; backgroundColor: string; backgroundImage: string; colors?: string[] }) => void;
  onResetSystem?: () => void;
  activeSystemAuraName?: string | null;
}

interface SpringObj {
  x: number;
  v: number;
  meta: number;
  k: number;
  c: number;
  e: number;
}

interface PointState {
  i: number;
  obj: [number, number];
  pos0: [number, number];
  rgb: [number, number, number];
  hsl: [number, number, number];
  arrastra: boolean;
  fx: number;
  fy: number;
  f0: number;
  f1: number;
  tx: number;
  ty: number;
  px: SpringObj;
  py: SpringObj;
  cs: SpringObj[];
  m: SpringObj;
  df: SpringObj;
  el?: HTMLButtonElement;
}

const AJUSTES = {
  pos: { k: 135, c: 13 },     // Rápido y reactivo al dedo
  color: { k: 40, c: 11 },
  masa: { k: 110, c: 12 },
  deriva: { k: 8, c: 5.0 },
  estira: 4.4,
  derrama: 4.4,
  amplitud: 0.045,           // Movimiento cósmico visible de respiración
  suavidad: 2.0,
  fluido: 0.35,              // Ondulaciones vivas de Aurora Boreal
  croma: 0.55,
  grano: 0.03,
};

const CAPA = 52;
const DISPOSICIONES: Record<number, { ancha: [number, number][]; estrecha: [number, number][] }> = {
  2: {
    ancha: [[0.30, 0.40], [0.70, 0.60]],
    estrecha: [[0.32, 0.24], [0.68, 0.44]],
  },
  3: {
    ancha: [[0.22, 0.35], [0.50, 0.68], [0.78, 0.35]],
    estrecha: [[0.24, 0.20], [0.76, 0.20], [0.50, 0.44]],
  },
  4: {
    ancha: [[0.22, 0.30], [0.78, 0.30], [0.30, 0.70], [0.70, 0.70]],
    estrecha: [[0.24, 0.18], [0.76, 0.18], [0.26, 0.42], [0.74, 0.42]],
  },
};

const lim = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const resorte = (x: number, par: { k: number; c: number }, e = 0.0006): SpringObj => ({
  x,
  v: 0,
  meta: x,
  k: par.k,
  c: par.c,
  e,
});

function avanza(r: SpringObj, dt: number) {
  for (let t = dt; t > 0;) {
    const h = Math.min(t, 1 / 240);
    r.v += (r.k * (r.meta - r.x) - r.c * r.v) * h;
    r.x += r.v * h;
    t -= h;
  }
}

const enReposo = (r: SpringObj) => Math.abs(r.v) < r.e * 10 && Math.abs(r.meta - r.x) < r.e;
const fija = (r: SpringObj) => { r.x = r.meta; r.v = 0; };

function hex2rgb(h: string): [number, number, number] {
  h = h.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const rgb2hex = (c: [number, number, number]) =>
  '#' + c.map(v => Math.round(lim(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');

function rgb2hsl(r: number, g: number, b: number): [number, number, number] {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  let h = 0;
  let s = 0;
  if (d > 1e-6) {
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

function hsl2rgb(h: number, s: number, l: number): [number, number, number] {
  h = (((h % 360) + 360) % 360) / 360;
  const f = (p: number, q: number, t: number) => {
    t = (t + 1) % 1;
    return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
  };
  if (s < 1e-6) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)];
}

// Pre-cálculo OKLab en JS para no sobrecargar el GPU móvil
function toOKLab(r: number, g: number, b: number): [number, number, number] {
  const cr = Math.pow(Math.max(0, r), 2.2);
  const cg = Math.pow(Math.max(0, g), 2.2);
  const cb = Math.pow(Math.max(0, b), 2.2);
  const l = Math.cbrt(0.4122214708 * cr + 0.5363325363 * cg + 0.0514459929 * cb);
  const m = Math.cbrt(0.2119034982 * cr + 0.6806995451 * cg + 0.1073969566 * cb);
  const s = Math.cbrt(0.0883024619 * cr + 0.2817188376 * cg + 0.6299787005 * cb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
}

const VERT = 'attribute vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }';
const FRAG = [
  'precision mediump float;',
  'uniform vec2 u_res; uniform float u_t; uniform int u_n; uniform vec2 u_p[4]; uniform vec3 u_c[4]; uniform vec2 u_s[4]; uniform float u_m[4];',
  'uniform float u_soft; uniform float u_fluid; uniform float u_grano; uniform float u_estira; uniform float u_croma;',
  'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
  'float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);',
  '  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }',
  'vec3 deOK(vec3 c) {',
  '  float l = c.x + .3963377774 * c.y + .2158037573 * c.z, m = c.x - .1055613458 * c.y - .0638541728 * c.z, s = c.x - .0894841775 * c.y - 1.291485548 * c.z;',
  '  l = l * l * l; m = m * m * m; s = s * s * s;',
  '  return vec3(4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.707614701 * s); }',
  'void main() {',
  '  float asp = u_res.x / u_res.y;',
  '  vec2 uv = gl_FragCoord.xy / u_res;',
  '  vec2 q = vec2(uv.x * asp, uv.y);',
  '  // Ondulaciones fluidas vivas de Aurora Boreal',
  '  vec2 w = vec2(noise(q * 1.6 + vec2(u_t * .55, u_t * .25)), noise(q * 1.6 + vec2(7.3 - u_t * .38, 2.1 + u_t * .45))) - .5;',
  '  w += .5 * (vec2(noise(q * 3.2 + vec2(u_t * .7, 4.)), noise(q * 3.2 + vec2(1., -u_t * .6))) - .5);',
  '  q += w * u_fluid;',
  '  vec3 col = vec3(0.); float tot = 0., chroma = 0.;',
  '  for (int i = 0; i < 4; i++) {',
  '    if (i >= u_n) break;',
  '    vec2 p = vec2(u_p[i].x * asp, u_p[i].y);',
  '    vec2 d = q - p;',
  '    float L = length(u_s[i]);',
  '    if (L > .0005) { vec2 e = u_s[i] / L; vec2 n = vec2(-e.y, e.x); float a = dot(d, e), b = dot(d, n);',
  '      a = a > 0. ? a / (1. + L * u_estira) : a * (1. + L * .8); d = e * a + n * b; }',
  '    float r2 = dot(d, d);',
  '    float k = u_m[i] / pow(r2 + .02, u_soft);',
  '    vec3 ok = u_c[i]; col += k * ok; chroma += k * length(ok.yz); tot += k;',
  '  }',
  '  col /= max(tot, 0.0001); chroma /= max(tot, 0.0001); float cm = length(col.yz);',
  '  if (cm > .0001) col.yz *= mix(1., min(chroma / cm, 2.2), u_croma);',
  '  col = pow(clamp(deOK(col), 0., 1.), vec3(1. / 2.2));',
  '  col += (hash(gl_FragCoord.xy) - .5) * u_grano;',
  '  gl_FragColor = vec4(col, 1.);',
  '}',
].join('\n');

export const MoxenMalla: React.FC<MoxenMallaProps> = ({
  className = '',
  onApplyToSystem,
  onResetSystem,
  activeSystemAuraName = null,
}) => {
  const [pointCount, setPointCount] = useState<2 | 3 | 4>(3);
  const [activePreset, setActivePreset] = useState<string>('aurora');
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFsControls, setShowFsControls] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState(false);
  const [auroraSpeed, setAuroraSpeed] = useState<'normal' | 'fast'>('fast');
  const [pointColors, setPointColors] = useState<string[]>(MOXEN_MALLA_PRESETS[0].colors.slice(0, 3));

  const currPreset = MOXEN_MALLA_PRESETS.find(p => p.id === activePreset) || MOXEN_MALLA_PRESETS[0];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const placeholderRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const capaRef = useRef<HTMLDivElement | null>(null);
  const aroRef = useRef<HTMLDivElement | null>(null);

  const ptosRef = useRef<PointState[]>([]);
  const pointCountRef = useRef<2 | 3 | 4>(3);
  const baseColorRef = useRef<string>(MOXEN_MALLA_PRESETS[0].base);
  const activePresetRef = useRef<string>('aurora');
  const speedMultiplierRef = useRef<number>(1.0);
  const triggerAzarRef = useRef<(() => void) | null>(null);
  const triggerResetRef = useRef<(() => void) | null>(null);
  const getCssRef = useRef<(() => string) | null>(null);
  const updateSingleColorRef = useRef<((idx: number, hex: string) => void) | null>(null);
  const changePointCountRef = useRef<((count: 2 | 3 | 4) => void) | null>(null);

  pointCountRef.current = pointCount;
  speedMultiplierRef.current = auroraSpeed === 'fast' ? 1.4 : 0.8;

  const selectedPointIndexRef = useRef(selectedPointIndex);
  selectedPointIndexRef.current = selectedPointIndex;
  const isFullscreenRef = useRef(isFullscreen);
  isFullscreenRef.current = isFullscreen;
  const showFsControlsRef = useRef(showFsControls);
  showFsControlsRef.current = showFsControls;

  const toggleFullscreen = () => {
    soundFX.playClick();
    const willBeFs = !isFullscreen;
    setIsFullscreen(willBeFs);
    if (willBeFs) {
      setShowFsControls(true);
    }

    const el = containerRef.current;
    if (willBeFs) {
      if (el?.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if ((el as any)?.webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any)?.webkitFullscreenElement && (document as any)?.webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  // Fullscreen breakout al #root (escapa cualquier transform y preserva eventos de React)
  useEffect(() => {
    const el = containerRef.current;
    const placeholder = placeholderRef.current;
    if (!el || !placeholder) return;
    const parent = placeholder.parentElement;
    if (!parent) return;

    const rootTarget = document.getElementById('root') || document.body;

    if (isFullscreen) {
      rootTarget.appendChild(el);
      document.body.style.overflow = 'hidden';
    } else {
      if (el.parentElement === rootTarget || el.parentElement === document.body) {
        parent.insertBefore(el, placeholder);
      }
      document.body.style.overflow = '';
    }

    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);

    return () => {
      clearTimeout(timer);
      if (el && (el.parentElement === rootTarget || el.parentElement === document.body) && placeholder && placeholder.parentElement) {
        placeholder.parentElement.insertBefore(el, placeholder);
      }
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Escape key & native fullscreen event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    const onFsChange = () => {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isFs && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, [isFullscreen]);

  // Main WebGL & Spring Physics initialization
  useEffect(() => {
    const lienzo = canvasRef.current;
    const capa = capaRef.current;
    const aro = aroRef.current;
    if (!lienzo || !capa || !aro) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const quieto = () => mq.matches;
    const estrecha = () => window.innerWidth <= 860;
    const getDisp = (count: number) => DISPOSICIONES[count][estrecha() ? 'estrecha' : 'ancha'];

    const preset = MOXEN_MALLA_PRESETS.find(p => p.id === activePresetRef.current) || MOXEN_MALLA_PRESETS[0];
    baseColorRef.current = preset.base;

    const rnd = mulberry32(7);
    let currCount: 2 | 3 | 4 = pointCountRef.current;

    function buildPoints(count: 2 | 3 | 4, colorsList: string[]) {
      capa!.querySelectorAll('.ml-punto').forEach(el => el.remove());
      const disp = getDisp(count);
      const points: PointState[] = colorsList.slice(0, count).map((hex, i) => {
        const rgb = hex2rgb(hex);
        const pos = disp[i] || [0.5, 0.5];
        return {
          i,
          obj: [pos[0], pos[1]],
          pos0: [pos[0], pos[1]],
          rgb: [rgb[0], rgb[1], rgb[2]],
          hsl: rgb2hsl(rgb[0], rgb[1], rgb[2]),
          arrastra: false,
          fx: 0.42 + rnd() * 0.3,
          fy: 0.36 + rnd() * 0.3,
          f0: rnd() * 6.28,
          f1: rnd() * 6.28,
          tx: pos[0],
          ty: pos[1],
          px: resorte(pos[0], AJUSTES.pos),
          py: resorte(pos[1], AJUSTES.pos),
          cs: rgb.map(v => resorte(v, AJUSTES.color, 0.0008)),
          m: resorte(1, AJUSTES.masa, 0.002),
          df: resorte(1, AJUSTES.deriva, 0.002),
        };
      });

      points.forEach(p => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'ml-punto';
        el.dataset.i = String(p.i);
        el.setAttribute('aria-label', `Punto ${p.i + 1}`);
        capa!.insertBefore(el, aro);
        p.el = el;
      });

      ptosRef.current = points;
      setPointColors(points.map(p => rgb2hex(p.rgb)));
      return points;
    }

    let ptos = buildPoints(currCount, preset.colors);

    let gl: WebGLRenderingContext | null =
      lienzo.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false }) ||
      (lienzo.getContext('experimental-webgl') as WebGLRenderingContext | null);

    let prog: WebGLProgram | null = null;
    const U: Record<string, WebGLUniformLocation | null> = {};

    if (gl) {
      const sh = (tipo: number, src: string) => {
        const s = gl!.createShader(tipo);
        if (!s) return null;
        gl!.shaderSource(s, src);
        gl!.compileShader(s);
        if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
          console.error('[MoxenMalla] Shader compile error:', gl!.getShaderInfoLog(s));
          return null;
        }
        return s;
      };
      const vs = sh(gl.VERTEX_SHADER, VERT);
      const fs = sh(gl.FRAGMENT_SHADER, FRAG);
      if (vs && fs) {
        prog = gl.createProgram();
        if (prog) {
          gl.attachShader(prog, vs);
          gl.attachShader(prog, fs);
          gl.linkProgram(prog);
          if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            gl.useProgram(prog);
            const buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
            const loc = gl.getAttribLocation(prog, 'a');
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
            ['u_res', 'u_t', 'u_n', 'u_p', 'u_c', 'u_s', 'u_m', 'u_soft', 'u_fluid', 'u_grano', 'u_estira', 'u_croma'].forEach(n => {
              U[n] = gl!.getUniformLocation(prog!, n);
            });
          }
        }
      }
    }

    let W = 1;
    let H = 1;
    let tiempo = 0;

    function mide() {
      const r = capa!.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      if (gl) {
        const isMobile = window.innerWidth <= 860;
        const dpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.25);
        lienzo!.width = Math.round(W * dpr);
        lienzo!.height = Math.round(H * dpr);
        gl.viewport(0, 0, lienzo!.width, lienzo!.height);
      }
    }

    const bufP = new Float32Array(4 * 2);
    const bufC = new Float32Array(4 * 3);
    const bufS = new Float32Array(4 * 2);
    const bufM = new Float32Array(4);

    function pinta() {
      if (!gl || !prog) return;
      const asp = W / H;
      const count = ptos.length;
      ptos.forEach((p, i) => {
        bufP[i * 2] = p.px.x;
        bufP[i * 2 + 1] = 1 - p.py.x;
        const ok = toOKLab(p.cs[0].x, p.cs[1].x, p.cs[2].x);
        bufC[i * 3] = ok[0];
        bufC[i * 3 + 1] = ok[1];
        bufC[i * 3 + 2] = ok[2];
        bufS[i * 2] = (p.tx - p.px.x) * asp;
        bufS[i * 2 + 1] = -(p.ty - p.py.x);
        bufM[i] = p.m.x;
      });
      gl.uniform2f(U.u_res!, lienzo!.width, lienzo!.height);
      gl.uniform1f(U.u_t!, tiempo);
      gl.uniform1i(U.u_n!, count);
      gl.uniform2fv(U.u_p!, bufP);
      gl.uniform3fv(U.u_c!, bufC);
      gl.uniform2fv(U.u_s!, bufS);
      gl.uniform1fv(U.u_m!, bufM);
      gl.uniform1f(U.u_soft!, AJUSTES.suavidad);
      gl.uniform1f(U.u_fluid!, AJUSTES.fluido);
      gl.uniform1f(U.u_grano!, AJUSTES.grano);
      gl.uniform1f(U.u_estira!, AJUSTES.estira);
      gl.uniform1f(U.u_croma!, AJUSTES.croma);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    let raf = 0;
    let ultimoTs = 0;
    const deriva = (p: PointState, t: number) => [Math.sin(t * p.fx + p.f0), Math.cos(t * p.fy + p.f1)];

    function paso(dt: number) {
      const q = quieto();
      if (!q) tiempo += dt * speedMultiplierRef.current;
      ptos.forEach(p => {
        p.df.meta = p.arrastra || selec === p.i || q ? 0 : 1;
        if (p.arrastra) {
          p.df.x = 0;
          p.df.v = 0;
        } else {
          avanza(p.df, dt);
        }
        const d = deriva(p, tiempo);
        p.tx = p.obj[0] + d[0] * AJUSTES.amplitud * (q ? 0 : p.df.x);
        p.ty = p.obj[1] + d[1] * AJUSTES.amplitud * (q ? 0 : p.df.x);
        p.px.meta = p.tx;
        p.py.meta = p.ty;
        p.cs.forEach((r, k) => { r.meta = p.rgb[k]; });
        const sx = p.tx - p.px.x;
        const sy = p.ty - p.py.x;
        const L = Math.hypot(sx, sy);
        p.m.meta = 1 + Math.min(1.3, L * AJUSTES.derrama);
        if (q) {
          fija(p.px); fija(p.py); p.cs.forEach(fija); fija(p.m);
        } else {
          avanza(p.px, dt);
          avanza(p.py, dt);
          p.cs.forEach(r => avanza(r, dt));
          avanza(p.m, dt);
        }
      });
    }

    function coloca() {
      ptos.forEach(p => {
        if (!p.el) return;
        const x = (p.tx * W).toFixed(1) + 'px';
        const y = (p.ty * H).toFixed(1) + 'px';
        p.el.style.left = x;
        p.el.style.top = y;
        const c = rgb2hex([p.cs[0].x, p.cs[1].x, p.cs[2].x]);
        p.el.style.setProperty('--c', c);
      });
      if (selec !== -1) colocaAro();
    }

    function cuadro(ts: number) {
      raf = 0;
      if (W <= 1 || H <= 1) mide();
      const dt = ultimoTs ? lim((ts - ultimoTs) / 1000, 0, 0.05) : 1 / 60;
      ultimoTs = ts;
      paso(dt);
      pinta();
      coloca();
      raf = requestAnimationFrame(cuadro);
    }

    function despierta() {
      if (!raf) raf = requestAnimationFrame(cuadro);
    }

    const pc = (v: number) => Math.round(lim(v, 0, 1) * 100);
    const hexDe = (p: PointState) => rgb2hex(p.rgb);
    const xyDe = (p: PointState) => `${pc(p.obj[0])}% ${pc(p.obj[1])}%`;

    function css() {
      const capas = ptos.map(p => `  radial-gradient(at ${xyDe(p)}, ${hexDe(p)}, transparent ${CAPA}%)`);
      return `background-color: ${baseColorRef.current};\nbackground-image:\n${capas.join(',\n')};`;
    }
    getCssRef.current = css;

    /* ── Aro de Tono Circular (HSL) ─────────────────────────────────── */
    let selec = -1;
    let girando = false;

    function colocaAro() {
      const p = ptos[selec];
      if (!p || !aro) return;
      aro.style.left = (p.tx * W).toFixed(1) + 'px';
      aro.style.top = (p.ty * H).toFixed(1) + 'px';
    }

    function ponAsa() {
      const p = ptos[selec];
      if (!p || !aro) return;
      aro.style.setProperty('--giro', `${p.hsl[0].toFixed(1)}deg`);
      aro.style.setProperty('--tono', rgb2hex(p.rgb));
    }

    function marcaSel() {
      ptos.forEach(p => {
        p.el?.classList.toggle('is-sel', p.i === selec);
      });
    }

    function abreAro(i: number) {
      selec = i;
      setSelectedPointIndex(i);
      aro!.hidden = false;
      colocaAro();
      ponAsa();
      marcaSel();
      void aro!.offsetWidth;
      aro!.classList.add('is-abierto');
    }

    function cierraAro() {
      if (selec === -1) return;
      selec = -1;
      aro!.classList.remove('is-abierto', 'is-gira');
      marcaSel();
      setTimeout(() => { if (selec === -1 && aro) aro.hidden = true; }, quieto() ? 0 : 420);
    }

    function cambiaTono(p: PointState, h: number) {
      p.hsl[0] = ((h % 360) + 360) % 360;
      p.rgb = hsl2rgb(p.hsl[0], p.hsl[1], p.hsl[2]);
      ponAsa();
      setPointColors(ptos.map(pt => rgb2hex(pt.rgb)));
      despierta();
    }

    function giraAro(x: number, y: number) {
      const p = ptos[selec];
      if (!p) return;
      const h = (Math.atan2(x - p.tx * W, -(y - p.ty * H)) * 180) / Math.PI;
      cambiaTono(p, h);
    }

    /* ── Eventos de Puntero ─────────────────────────────────────────── */
    let arr: { p: PointState; id: number; moved: boolean; x0: number; y0: number; dx: number; dy: number; fondo: boolean } | null = null;
    const aPunto = (e: PointerEvent): [number, number] => {
      const r = capa!.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };

    function masCercano(x: number, y: number) {
      let mejor: PointState | null = null;
      let d2 = 1e12;
      ptos.forEach(p => {
        const d = Math.pow(p.tx * W - x, 2) + Math.pow(p.ty * H - y, 2);
        if (d < d2) { d2 = d; mejor = p; }
      });
      return mejor;
    }

    function ponObj(p: PointState, x: number, y: number) {
      p.obj[0] = lim(x / W, 0.02, 0.98);
      p.obj[1] = lim(y / H, 0.02, 0.98);
      despierta();
      if (selec === p.i) colocaAro();
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button > 0) return;
      const [x, y] = aPunto(e);

      if (selec !== -1) {
        const p = ptos[selec];
        const d = Math.hypot(x - p.tx * W, y - p.ty * H);
        if (d > 26 && d < 64) {
          girando = true;
          capa.setPointerCapture(e.pointerId);
          aro.classList.add('is-gira');
          giraAro(x, y);
          e.preventDefault();
          return;
        }
        if (d >= 64) cierraAro();
      }

      const btn = (e.target as HTMLElement).closest('.ml-punto') as HTMLElement | null;

      // En modo normal, si el usuario toca el fondo vacío del lienzo, permitimos
      // que el gesto sea el scroll vertical natural de la página en vez de interceptarlo
      if (!btn && !isFullscreenRef.current) {
        return;
      }

      const p = btn ? ptos[Number(btn.dataset.i)] : masCercano(x, y);
      if (!p) return;

      capa.setPointerCapture(e.pointerId);
      arr = {
        p,
        id: e.pointerId,
        moved: false,
        x0: e.clientX,
        y0: e.clientY,
        dx: btn ? p.obj[0] * W - x : 0,
        dy: btn ? p.obj[1] * H - y : 0,
        fondo: !btn,
      };
      p.arrastra = true;
      p.el?.classList.add('is-arrastra');
      if (arr.fondo) ponObj(p, x, y);
      despierta();
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      const [x, y] = aPunto(e);
      if (girando) {
        giraAro(x, y);
        return;
      }
      if (!arr || e.pointerId !== arr.id) return;
      if (!arr.moved && Math.hypot(e.clientX - arr.x0, e.clientY - arr.y0) > 4) {
        arr.moved = true;
      }
      ponObj(arr.p, x + arr.dx, y + arr.dy);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (girando) {
        girando = false;
        aro.classList.remove('is-gira');
        return;
      }
      if (!arr || (e.pointerId !== undefined && e.pointerId !== arr.id)) return;
      const a = arr;
      arr = null;
      a.p.arrastra = false;
      a.p.el?.classList.remove('is-arrastra');
      if (!a.moved && !a.fondo) {
        if (selec === a.p.i) cierraAro();
        else abreAro(a.p.i);
      }
      despierta();
    };

    capa.addEventListener('pointerdown', onPointerDown);
    capa.addEventListener('pointermove', onPointerMove);
    capa.addEventListener('pointerup', onPointerUp);
    capa.addEventListener('pointercancel', onPointerUp);

    const azar = () => {
      soundFX.playClick();
      const r = 0.12;
      ptos.forEach(p => {
        p.obj = [
          lim(r + Math.random() * (1 - 2 * r), 0.08, 0.92),
          lim(r + Math.random() * (1 - 2 * r), 0.08, 0.92),
        ];
      });
      const shift = 1 + Math.floor(Math.random() * (ptos.length - 1));
      const prevColores = ptos.map(p => ({ rgb: p.rgb.slice() as [number, number, number], hsl: p.hsl.slice() as [number, number, number] }));
      ptos.forEach((p, idx) => {
        const o = prevColores[(idx + shift) % ptos.length];
        p.rgb = o.rgb;
        p.hsl = o.hsl;
      });
      if (selec !== -1) cierraAro();
      setPointColors(ptos.map(p => rgb2hex(p.rgb)));
      despierta();
    };
    triggerAzarRef.current = azar;

    const restablecer = () => {
      soundFX.playClick();
      const presetActive = MOXEN_MALLA_PRESETS.find(p => p.id === activePresetRef.current) || MOXEN_MALLA_PRESETS[0];
      baseColorRef.current = presetActive.base;
      const disp = getDisp(ptos.length);
      ptos.forEach((p, idx) => {
        const rgb = hex2rgb(presetActive.colors[idx % presetActive.colors.length]);
        p.obj = (disp[idx] || [0.5, 0.5]).slice() as [number, number];
        p.rgb = rgb;
        p.hsl = rgb2hsl(rgb[0], rgb[1], rgb[2]);
      });
      if (selec !== -1) cierraAro();
      setPointColors(ptos.map(p => rgb2hex(p.rgb)));
      despierta();
    };
    triggerResetRef.current = restablecer;

    updateSingleColorRef.current = (idx: number, hex: string) => {
      const p = ptos[idx];
      if (!p) return;
      const rgb = hex2rgb(hex);
      p.rgb = rgb;
      p.hsl = rgb2hsl(rgb[0], rgb[1], rgb[2]);
      if (selec === idx) ponAsa();
      setPointColors(ptos.map(pt => rgb2hex(pt.rgb)));
      despierta();
    };

    changePointCountRef.current = (newCount: 2 | 3 | 4) => {
      if (newCount === ptos.length) return;
      const currentColors = ptos.map(p => rgb2hex(p.rgb));
      const presetActive = MOXEN_MALLA_PRESETS.find(p => p.id === activePresetRef.current) || MOXEN_MALLA_PRESETS[0];
      const mergedColors = [...currentColors, ...presetActive.colors];
      cierraAro();
      ptos = buildPoints(newCount, mergedColors);
      mide();
      coloca();
      pinta();
      despierta();
    };

    const resizeObserver = new ResizeObserver(() => {
      mide();
      pinta();
      coloca();
    });
    resizeObserver.observe(capa);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    mide();
    ptos.forEach(p => {
      p.tx = p.obj[0];
      p.ty = p.obj[1];
    });
    coloca();
    pinta();
    despierta();

    return () => {
      resizeObserver.disconnect();
      capa.removeEventListener('pointerdown', onPointerDown);
      capa.removeEventListener('pointermove', onPointerMove);
      capa.removeEventListener('pointerup', onPointerUp);
      capa.removeEventListener('pointercancel', onPointerUp);
      if (raf) cancelAnimationFrame(raf);
      capa.querySelectorAll('.ml-punto').forEach(el => el.remove());
    };
  }, []);

  const handleSelectPreset = useCallback((presetId: string) => {
    soundFX.playClick();
    setActivePreset(presetId);
    activePresetRef.current = presetId;
    const targetPreset = MOXEN_MALLA_PRESETS.find(p => p.id === presetId);
    if (targetPreset && updateSingleColorRef.current) {
      targetPreset.colors.slice(0, pointCount).forEach((c, idx) => {
        updateSingleColorRef.current?.(idx, c);
      });
    }
  }, [pointCount]);

  const handleChangePointCount = (count: 2 | 3 | 4) => {
    soundFX.playClick();
    setPointCount(count);
    if (selectedPointIndex >= count) {
      setSelectedPointIndex(count - 1);
    }
    changePointCountRef.current?.(count);
  };

  const handleUpdateColor = (idx: number, hex: string) => {
    soundFX.playClick();
    updateSingleColorRef.current?.(idx, hex);
  };

  const handleCopyCss = () => {
    soundFX.playClick();
    if (!getCssRef.current) return;
    const code = getCssRef.current();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code);
      }
    } catch (e) {
      console.warn('Clipboard write fallback');
    }
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2200);
  };

  const handleApplyToSystem = () => {
    soundFX.playLevelUp?.();
    if (!getCssRef.current) return;
    const code = getCssRef.current();
    const currPreset = MOXEN_MALLA_PRESETS.find(p => p.id === activePreset);
    
    const bgColMatch = code.match(/background-color:\s*([^;]+);/);
    const bgImgMatch = code.match(/background-image:\s*([\s\S]+?);/);

    const activeColors = pointColors.slice(0, pointCount);

    const aura = {
      name: `${currPreset ? currPreset.name : 'Malla Aurora'} (${pointCount} Tonos)`,
      backgroundColor: bgColMatch ? bgColMatch[1].trim() : '#020d18',
      backgroundImage: bgImgMatch ? bgImgMatch[1].trim() : '',
      colors: activeColors,
    };

    if (onApplyToSystem) {
      onApplyToSystem(aura);
    }
    setApplyFeedback(true);
    setTimeout(() => setApplyFeedback(false), 3000);
  };

  // Delegación de eventos nativos en el contenedor para máxima fiabilidad en fullscreen
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onNativeClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('[data-action]') as HTMLElement | null;
      if (!target) return;

      const action = target.dataset.action;
      if (!action) return;

      if (action === 'toggle-fullscreen') {
        toggleFullscreen();
      } else if (action === 'toggle-hud') {
        soundFX.playClick();
        setShowFsControls(prev => !prev);
      } else if (action === 'preset') {
        const id = target.dataset.presetId;
        if (id) handleSelectPreset(id);
      } else if (action === 'point-count') {
        const c = Number(target.dataset.count) as 2 | 3 | 4;
        if (c === 2 || c === 3 || c === 4) handleChangePointCount(c);
      } else if (action === 'toggle-speed') {
        soundFX.playClick();
        setAuroraSpeed(prev => prev === 'fast' ? 'normal' : 'fast');
      } else if (action === 'select-gem') {
        const idx = Number(target.dataset.gemIdx);
        if (!isNaN(idx)) {
          soundFX.playClick();
          setSelectedPointIndex(idx);
        }
      } else if (action === 'swatch') {
        const hex = target.dataset.swatchHex;
        if (hex) handleUpdateColor(selectedPointIndexRef.current, hex);
      } else if (action === 'apply-system') {
        handleApplyToSystem();
      } else if (action === 'azar') {
        triggerAzarRef.current?.();
      } else if (action === 'reset') {
        triggerResetRef.current?.();
      }
    };

    const onNativeChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && target.type === 'color' && target.dataset.action === 'color-input') {
        handleUpdateColor(selectedPointIndexRef.current, target.value);
      }
    };

    container.addEventListener('click', onNativeClick);
    container.addEventListener('change', onNativeChange);
    container.addEventListener('input', onNativeChange);

    return () => {
      container.removeEventListener('click', onNativeClick);
      container.removeEventListener('change', onNativeChange);
      container.removeEventListener('input', onNativeChange);
    };
  }, []);

  return (
    <div className={`moxen-malla-root space-y-4 ${className}`}>
      {/* ── BARRA SUPERIOR MINIMALISTA ── */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
            Malla Aurora
          </span>
          <span className="text-[10px] font-mono text-cyan-400/90 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/10">
            {currPreset.badge}
          </span>
        </div>

        {/* Preset Pills Minimalistas */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {MOXEN_MALLA_PRESETS.map(p => {
            const isSelected = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                  isSelected
                    ? 'bg-white/15 text-white border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.15)] font-bold'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                }`}
                title={p.desc}
              >
                <span 
                  className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_currentColor]"
                  style={{ background: p.colors[0], color: p.colors[0] }}
                />
                <span>{p.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ESCENA DEL SHADER AURORA BOREAL ── */}
      <div ref={placeholderRef} style={{ display: 'none' }} />
      <div
        ref={containerRef}
        className={`ml-escena relative border border-white/10 rounded-2xl overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.5)] transition-all ${
          isFullscreen 
            ? 'is-fullscreen' 
            : 'h-[260px] sm:h-[320px] md:h-[360px]'
        }`}
      >
        {/* Canvas WebGL */}
        <canvas ref={canvasRef} className="ml-lienzo" aria-hidden="true" />

        {/* Capa de interacción y puntos flotantes */}
        <div ref={capaRef} className="ml-capa">
          {/* Aro de Tono Circular (HSL) */}
          <div
            ref={aroRef}
            className="ml-aro"
            role="slider"
            aria-label="Tono del punto"
            aria-valuemin={0}
            aria-valuemax={359}
            aria-valuenow={0}
            tabIndex={-1}
            hidden
          >
            <span className="ml-aro-anillo" aria-hidden="true" />
            <span className="ml-aro-asa" aria-hidden="true" />
          </div>
        </div>

        {/* MODO NORMAL: Botón de Pantalla Completa Flotante Minimalista */}
        {!isFullscreen && (
          <button
            type="button"
            data-action="toggle-fullscreen"
            onClick={toggleFullscreen}
            className="chicle-btn absolute top-3 right-3 z-40 px-2.5 py-1.5 rounded-lg border border-white/15 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-md flex items-center gap-1.5 text-[11px] font-mono shadow-sm"
            title="Expandir a pantalla completa"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-medium">Pantalla Completa</span>
          </button>
        )}

        {/* MODO PANTALLA COMPLETA: CABECERA CON SAFE-AREA Y BOTÓN DE SALIDA DESTACADO */}
        {isFullscreen && (
          <div
            className="absolute top-0 inset-x-0 z-[100] flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 pointer-events-auto"
            style={{ paddingTop: 'max(14px, env(safe-area-inset-top, 14px))' }}
          >
            {/* Badge de Estado Aurora Boreal */}
            <div className="flex items-center gap-2 bg-[#000d1c]/90 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.25)]">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00f0ff]" />
              <span className="text-[11px] sm:text-xs font-mono font-black text-white tracking-wider uppercase">
                {currPreset?.name || 'Malla Aurora'}
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-300 border-l border-slate-700 pl-2">
                {pointCount} Tonos
              </span>
            </div>

            {/* Controles de Cabecera: Toggle HUD y Botón Salir */}
            <div className="flex items-center gap-2">
              {/* Toggle Ocultar/Mostrar Controles HUD */}
              <button
                type="button"
                data-action="toggle-hud"
                onClick={() => {
                  soundFX.playClick();
                  setShowFsControls(!showFsControls);
                }}
                className="chicle-btn px-3 py-2 rounded-xl bg-black/80 hover:bg-black/95 border border-cyan-500/50 text-cyan-300 hover:text-white flex items-center gap-1.5 text-xs font-mono font-bold shadow-lg cursor-pointer backdrop-blur-md"
                title={showFsControls ? 'Ocultar panel para vista limpia' : 'Mostrar panel de controles'}
              >
                {showFsControls ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{showFsControls ? 'Ocultar Panel' : 'Panel de Control'}</span>
              </button>

              {/* BOTÓN DEFINITIVO DE SALIDA PANTALLA COMPLETA */}
              <button
                type="button"
                data-action="toggle-fullscreen"
                onClick={toggleFullscreen}
                className="chicle-btn px-3.5 sm:px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 border-2 border-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.7)] cursor-pointer ring-2 ring-rose-500/50"
                title="Salir de pantalla completa (Esc)"
              >
                <X className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">Salir Pantalla Completa</span>
                <span className="sm:hidden">Salir</span>
              </button>
            </div>
          </div>
        )}

        {/* MODO PANTALLA COMPLETA: DOCK FLOTANTE DE COLORES HUD (CON CONTROLES COMPLETOS) */}
        {isFullscreen && showFsControls && (
          <div
            className="absolute bottom-0 inset-x-0 z-[100] px-3 sm:px-6 py-3 sm:py-4 pointer-events-none flex justify-center"
            style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))' }}
          >
            <div
              className="pointer-events-auto w-full max-w-3xl bg-[#00152b]/95 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,240,255,0.25)] space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/40"
            >
              {/* FILA 1: PRESETS RÁPIDOS + SELECTOR DE NODOS (2, 3 o 4) + VELOCIDAD */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                {/* Presets en Pills scrollables */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
                  {MOXEN_MALLA_PRESETS.map(p => {
                    const isSelected = activePreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        data-action="preset"
                        data-preset-id={p.id}
                        onClick={() => handleSelectPreset(p.id)}
                        className={`chicle-btn px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 shrink-0 border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.6)] font-black'
                            : 'bg-[#000d1c] border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span 
                          className="w-2 h-2 rounded-full shrink-0 border border-black/40"
                          style={{ background: p.colors[0] }}
                        />
                        <span>{p.badge}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Nodos (2, 3 o 4) y Velocidad */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#000d1c] p-0.5 rounded-lg border border-slate-800">
                    {([2, 3, 4] as const).map(num => (
                      <button
                        key={num}
                        type="button"
                        data-action="point-count"
                        data-count={num}
                        onClick={() => handleChangePointCount(num)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-black transition-all cursor-pointer ${
                          pointCount === num
                            ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    data-action="toggle-speed"
                    onClick={() => {
                      soundFX.playClick();
                      setAuroraSpeed(auroraSpeed === 'fast' ? 'normal' : 'fast');
                    }}
                    className={`chicle-btn px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                      auroraSpeed === 'fast'
                        ? 'bg-purple-950/80 border-purple-400/60 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                        : 'bg-[#000d1c] border-slate-800 text-slate-400'
                    }`}
                  >
                    <Waves className="w-3 h-3 text-cyan-400" />
                    <span>{auroraSpeed === 'fast' ? '⚡ Viva' : '❄️ Calm'}</span>
                  </button>
                </div>
              </div>

              {/* FILA 2: GEMAS ACTIVAS (TOCAR PARA SELECCIONAR) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
                  {pointColors.slice(0, pointCount).map((colHex, idx) => {
                    const isSelected = selectedPointIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        data-action="select-gem"
                        data-gem-idx={idx}
                        onClick={() => {
                          soundFX.playClick();
                          setSelectedPointIndex(idx);
                        }}
                        className={`chicle-btn px-2.5 py-1.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                          isSelected
                            ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)] ring-2 ring-cyan-400/50'
                            : 'bg-[#000d1c] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0 border-2 border-white shadow-[0_0_8px_currentColor]"
                          style={{ background: colHex, color: colHex }}
                        />
                        <span className="text-[11px] font-mono font-black text-white uppercase">
                          {colHex}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selector de color libre */}
                <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#000d1c] border border-cyan-500/40 text-cyan-400 hover:text-cyan-200 cursor-pointer shrink-0 text-xs font-mono font-bold">
                  <Palette className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Color Libre</span>
                  <input
                    type="color"
                    data-action="color-input"
                    value={pointColors[selectedPointIndex] || '#00f0ff'}
                    onChange={(e) => handleUpdateColor(selectedPointIndex, e.target.value)}
                    className="w-0 h-0 opacity-0 absolute pointer-events-none"
                  />
                </label>
              </div>

              {/* FILA 3: PALETA HUNTER NEÓN RÁPIDA (ASIGNA AL PUNTO SELECCIONADO AL INSTANTE) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest shrink-0">
                  Gema {selectedPointIndex + 1}:
                </span>
                {HUNTER_SWATCHES.map((sw, sIdx) => {
                  const isCurr = pointColors[selectedPointIndex]?.toLowerCase() === sw.hex.toLowerCase();
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      data-action="swatch"
                      data-swatch-hex={sw.hex}
                      onClick={() => handleUpdateColor(selectedPointIndex, sw.hex)}
                      className={`group relative p-0.5 rounded-lg transition-all shrink-0 cursor-pointer border ${
                        isCurr 
                          ? 'border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.7)]' 
                          : 'border-transparent hover:scale-105'
                      }`}
                      title={`${sw.name} (${sw.hex})`}
                    >
                      <span
                        className="w-6 h-6 rounded-md block border border-black/40 shadow-sm"
                        style={{ background: sw.hex }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* FILA 4: ACCIONES PRINCIPALES Y SALIR */}
              <div className="flex items-center gap-2 pt-1">
                {/* Botón Aplicar al Sistema */}
                <button
                  type="button"
                  data-action="apply-system"
                  onClick={handleApplyToSystem}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-anton uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.35)] ${
                    applyFeedback
                      ? 'bg-emerald-500 text-black border border-emerald-300 font-black'
                      : 'bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-black'
                  }`}
                >
                  {applyFeedback ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-black stroke-[3]" />
                      <span>¡Atmósfera Activada!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-black fill-black" />
                      <span>Aplicar como Fondo</span>
                    </>
                  )}
                </button>

                {/* Azar */}
                <button
                  type="button"
                  data-action="azar"
                  onClick={() => triggerAzarRef.current?.()}
                  className="chicle-btn p-2.5 rounded-xl bg-[#000d1c] hover:bg-[#001830] border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center cursor-pointer"
                  title="Barajar al azar"
                >
                  <Shuffle className="w-4 h-4 text-cyan-400" />
                </button>

                {/* Reset */}
                <button
                  type="button"
                  data-action="reset"
                  onClick={() => triggerResetRef.current?.()}
                  className="chicle-btn p-2.5 rounded-xl bg-[#000d1c] hover:bg-[#001830] border border-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center cursor-pointer"
                  title="Restablecer preset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Botón Salir en el dock inferior (Ultra Accesible con el pulgar) */}
                <button
                  type="button"
                  data-action="toggle-fullscreen"
                  onClick={toggleFullscreen}
                  className="chicle-btn px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-xs uppercase tracking-wider flex items-center gap-1.5 border border-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)] cursor-pointer"
                  title="Salir de pantalla completa"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pista Inferior Descriptiva */}
        <p className="ml-pista">
          <span className="ml-p-largo">Toca un nodo de color para moverlo · Pulsa "Pantalla Completa" para el laboratorio inmersivo</span>
          <span className="ml-p-corto">Toca o arrastra un nodo</span>
        </p>
      </div>

      {/* ── DOCK DE CONTROL MINIMALISTA (ULTRA-SLIM & ESTILIZADO) ── */}
      <div className="p-2.5 sm:p-3 bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-2xl space-y-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
        {/* FILA 1: SELECTOR DE TONOS + VELOCIDAD + HERRAMIENTAS RÁPIDAS */}
        <div className="flex items-center justify-between gap-2">
          {/* Segmented Tonos [ 2 | 3 | 4 ] */}
          <div className="flex items-center gap-0.5 bg-black/40 p-1 rounded-xl border border-white/10">
            <span className="text-[10px] font-mono text-slate-400 px-1.5 uppercase tracking-wider hidden sm:inline font-semibold">
              Tonos:
            </span>
            {([2, 3, 4] as const).map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleChangePointCount(num)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  pointCount === num
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Herramientas Rápidas: Velocidad + Azar + Reset + CSS */}
          <div className="flex items-center gap-1.5">
            {/* Velocidad Aurora */}
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setAuroraSpeed(auroraSpeed === 'fast' ? 'normal' : 'fast');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                auroraSpeed === 'fast'
                  ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
              }`}
              title="Velocidad Aurora: Normal / Rápida"
            >
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono hidden sm:inline">
                {auroraSpeed === 'fast' ? 'Viva' : 'Calma'}
              </span>
            </button>

            {/* Azar (Shuffle) */}
            <button
              type="button"
              onClick={() => triggerAzarRef.current?.()}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-black/30 hover:bg-black/50 border border-white/10 hover:border-white/25 text-slate-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Barajar al azar"
            >
              <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono hidden md:inline">Azar</span>
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={() => triggerResetRef.current?.()}
              className="p-1.5 sm:p-2 rounded-xl bg-black/30 hover:bg-black/50 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Restablecer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Copiar CSS */}
            <button
              type="button"
              onClick={handleCopyCss}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer ${
                copyFeedback
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                  : 'bg-black/30 hover:bg-black/50 border-white/10 text-slate-400 hover:text-white'
              }`}
              title="Copiar CSS"
            >
              {copyFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* FILA 2: RIBBON DE COLOR UNIFICADO (GEMAS ACTIVAS + PALETA RÁPIDA + COLOR PICKER) */}
        <div className="flex items-center justify-between gap-2 p-2 bg-black/30 rounded-xl border border-white/10 overflow-x-auto scrollbar-none">
          {/* Gemas activas seleccionables */}
          <div className="flex items-center gap-2 shrink-0">
            {pointColors.slice(0, pointCount).map((colHex, idx) => {
              const isSelected = selectedPointIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setSelectedPointIndex(idx);
                  }}
                  className={`relative p-0.5 rounded-full transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#030a18] scale-110 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                  title={`Gema ${idx + 1}: ${colHex}`}
                >
                  <span
                    className="w-6 h-6 rounded-full block border border-white/40"
                    style={{ background: colHex }}
                  />
                </button>
              );
            })}
          </div>

          <div className="h-5 w-px bg-white/10 shrink-0" />

          {/* Swatches rápidos de Cazador */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {HUNTER_SWATCHES.map((sw, sIdx) => {
              const isCurr = pointColors[selectedPointIndex]?.toLowerCase() === sw.hex.toLowerCase();
              return (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => handleUpdateColor(selectedPointIndex, sw.hex)}
                  className={`p-0.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                    isCurr
                      ? 'ring-1.5 ring-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                      : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                  title={`${sw.name} (${sw.hex})`}
                >
                  <span
                    className="w-5 h-5 rounded-md block border border-black/30 shadow-xs"
                    style={{ background: sw.hex }}
                  />
                </button>
              );
            })}
          </div>

          <div className="h-5 w-px bg-white/10 shrink-0" />

          {/* Color picker libre */}
          <label
            className="shrink-0 p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white cursor-pointer transition-all flex items-center justify-center"
            title="Seleccionar color personalizado"
          >
            <Palette className="w-4 h-4 text-cyan-300" />
            <input
              type="color"
              value={pointColors[selectedPointIndex] || '#00f0ff'}
              onChange={(e) => handleUpdateColor(selectedPointIndex, e.target.value)}
              className="w-0 h-0 opacity-0 absolute pointer-events-none"
            />
          </label>
        </div>

        {/* FILA 3: BOTÓN ESTELAR MINIMALISTA */}
        <button
          type="button"
          onClick={handleApplyToSystem}
          className={`w-full py-2.5 px-4 rounded-xl font-mono uppercase tracking-wider text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            applyFeedback
              ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] font-black'
              : 'bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black shadow-[0_0_20px_rgba(0,240,255,0.25)]'
          }`}
        >
          {applyFeedback ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-black stroke-[3]" />
              <span>¡Atmósfera Activada en el Sistema!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-black fill-black" />
              <span>Aplicar como Fondo del Sistema</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
