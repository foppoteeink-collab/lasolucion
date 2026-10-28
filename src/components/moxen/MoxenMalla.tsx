import React, { useEffect, useRef, useState, useCallback } from 'react';
import './moxen.css';
import { 
  Sparkles, RotateCcw, Copy, Check, Shuffle, Maximize2, Minimize2, 
  Palette, CheckCircle2, Layers, Compass, Zap
} from 'lucide-react';
import { soundFX } from '../../utils/audio';

export interface MoxenMallaPreset {
  id: string;
  name: string;
  badge: string;
  desc: string;
  base: string;
  colors: string[]; // Exactly 5 hex colors
}

export const MOXEN_MALLA_PRESETS: MoxenMallaPreset[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neón',
    badge: 'NEÓN',
    desc: 'Cian Cuántico, Ultravioleta, Magenta y Neón Lima',
    base: '#030712',
    colors: ['#00f0ff', '#7000ff', '#ff007f', '#00ff88', '#facc15']
  },
  {
    id: 'nebulosa',
    name: 'Nebulosa Cuántica',
    badge: 'CUÁNTICA',
    desc: 'Azul Cobalto, Lila Cósmico y Durazno Estelar',
    base: '#050b1a',
    colors: ['#2f7bd9', '#1a2a9c', '#7fb4ff', '#7a63e0', '#ff9d78']
  },
  {
    id: 'aurora',
    name: 'Aurora Solar & Plasma',
    badge: 'SOLAR',
    desc: 'Plasma Incandescente, Calipso y Fuego Estelar',
    base: '#0a040f',
    colors: ['#ff5e36', '#ffa234', '#00e5ff', '#a855f7', '#ff2a7a']
  },
  {
    id: 'abismo',
    name: 'Abismo Índigo (Zen)',
    badge: 'ZEN',
    desc: 'Aguas Abisales, Índigo y Cian Bioluminiscente',
    base: '#02040a',
    colors: ['#0ea5e9', '#6366f1', '#3b82f6', '#14b8a6', '#818cf8']
  },
  {
    id: 'matriz',
    name: 'Matriz Esmeralda',
    badge: 'MATRIZ',
    desc: 'Terminal Hacker, Esmeralda y Jade Bioquántico',
    base: '#02140c',
    colors: ['#10b981', '#064e3b', '#34d399', '#059669', '#a7f3d0']
  }
];

export interface MoxenMallaProps {
  className?: string;
  onApplyToSystem?: (aura: { name: string; backgroundColor: string; backgroundImage: string }) => void;
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
  fila?: HTMLElement;
  xy?: HTMLElement;
  hexEl?: HTMLElement;
  chip?: HTMLElement;
  claveCodigo?: string;
}

const AJUSTES = {
  pos: { k: 64, c: 7.2 },
  color: { k: 34, c: 10.5 },
  masa: { k: 110, c: 12 },
  deriva: { k: 6, c: 4.4 },
  estira: 4.4,
  derrama: 4.4,
  amplitud: 0.028,
  suavidad: 2.0,
  fluido: 0.17,
  croma: 0.55,
  grano: 0.03,
};

const N = 5;
const CAPA = 52;
const DISPOSICION = {
  ancha: [[0.17, 0.22], [0.37, 0.86], [0.49, 0.31], [0.57, 0.63], [0.08, 0.69]],
  estrecha: [[0.17, 0.17], [0.46, 0.38], [0.62, 0.15], [0.85, 0.32], [0.14, 0.36]],
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
  let clean = h.trim().replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  const n = parseInt(clean, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const rgb2hex = (c: number[]) =>
  '#' + c.map(v => Math.round(lim(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');

function rgb2hsl(r: number, g: number, b: number): [number, number, number] {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = 0;
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

const VERT = 'attribute vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }';
const FRAG = [
  '#ifdef GL_FRAGMENT_PRECISION_HIGH',
  'precision highp float;',
  '#else',
  'precision mediump float;',
  '#endif',
  'uniform vec2 u_res; uniform float u_t; uniform vec2 u_p[5]; uniform vec3 u_c[5]; uniform vec2 u_s[5]; uniform float u_m[5];',
  'uniform float u_soft; uniform float u_fluid; uniform float u_grano; uniform float u_estira; uniform float u_croma;',
  'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
  'float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);',
  '  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }',
  'vec3 aOK(vec3 c) {',
  '  float l = pow(.4122214708 * c.r + .5363325363 * c.g + .0514459929 * c.b, 1. / 3.);',
  '  float m = pow(.2119034982 * c.r + .6806995451 * c.g + .1073969566 * c.b, 1. / 3.);',
  '  float s = pow(.0883024619 * c.r + .2817188376 * c.g + .6299787005 * c.b, 1. / 3.);',
  '  return vec3(.2104542553 * l + .793617785 * m - .0040720468 * s, 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .808675766 * s); }',
  'vec3 deOK(vec3 c) {',
  '  float l = c.x + .3963377774 * c.y + .2158037573 * c.z, m = c.x - .1055613458 * c.y - .0638541728 * c.z, s = c.x - .0894841775 * c.y - 1.291485548 * c.z;',
  '  l = l * l * l; m = m * m * m; s = s * s * s;',
  '  return vec3(4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.707614701 * s); }',
  'void main() {',
  '  float asp = u_res.x / u_res.y;',
  '  vec2 uv = gl_FragCoord.xy / u_res;',
  '  vec2 q = vec2(uv.x * asp, uv.y);',
  '  vec2 w = vec2(noise(q * 1.7 + vec2(u_t * .11, u_t * .05)), noise(q * 1.7 + vec2(7.3 - u_t * .07, 2.1 + u_t * .09))) - .5;',
  '  w += .5 * (vec2(noise(q * 3.4 + vec2(u_t * .16, 4.)), noise(q * 3.4 + vec2(1., -u_t * .14))) - .5);',
  '  q += w * u_fluid;',
  '  vec3 col = vec3(0.); float tot = 0., chroma = 0.;',
  '  for (int i = 0; i < 5; i++) {',
  '    vec2 p = vec2(u_p[i].x * asp, u_p[i].y);',
  '    vec2 d = q - p;',
  '    float L = length(u_s[i]);',
  '    if (L > .0005) { vec2 e = u_s[i] / L; vec2 n = vec2(-e.y, e.x); float a = dot(d, e), b = dot(d, n);',
  '      a = a > 0. ? a / (1. + L * u_estira) : a * (1. + L * .8); d = e * a + n * b; }',
  '    float r2 = dot(d, d);',
  '    float k = u_m[i] / pow(r2 + .02, u_soft);',
  '    vec3 ok = aOK(pow(u_c[i], vec3(2.2))); col += k * ok; chroma += k * length(ok.yz); tot += k;',
  '  }',
  '  col /= tot; chroma /= tot; float cm = length(col.yz);',
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
  const [activePreset, setActivePreset] = useState<string>('cyberpunk');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const capaRef = useRef<HTMLDivElement | null>(null);
  const aroRef = useRef<HTMLDivElement | null>(null);
  const capasElRef = useRef<HTMLOListElement | null>(null);
  const baseElRef = useRef<HTMLSpanElement | null>(null);

  // References to dynamic state to bridge React & WebGL animation loop
  const ptosRef = useRef<PointState[]>([]);
  const baseColorRef = useRef<string>(MOXEN_MALLA_PRESETS[0].base);
  const activePresetRef = useRef<string>('cyberpunk');
  const triggerAzarRef = useRef<(() => void) | null>(null);
  const triggerResetRef = useRef<(() => void) | null>(null);
  const getCssRef = useRef<(() => string) | null>(null);
  const loadColorsRef = useRef<((colors: string[], base: string) => void) | null>(null);

  // Fullscreen escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Main WebGL & Spring Physics initialization
  useEffect(() => {
    const lienzo = canvasRef.current;
    const capa = capaRef.current;
    const aro = aroRef.current;
    const capasEl = capasElRef.current;
    const baseEl = baseElRef.current;
    if (!lienzo || !capa || !aro || !capasEl || !baseEl) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const quieto = () => mq.matches;
    const estrecha = () => window.innerWidth <= 860;
    const disposicion = () => DISPOSICION[estrecha() ? 'estrecha' : 'ancha'];

    const preset = MOXEN_MALLA_PRESETS.find(p => p.id === activePresetRef.current) || MOXEN_MALLA_PRESETS[0];
    baseColorRef.current = preset.base;
    baseEl.textContent = preset.base;

    const rnd = mulberry32(7);
    const initialColors = preset.colors;

    // Clear existing DOM buttons/layers
    capa.querySelectorAll('.ml-punto').forEach(el => el.remove());
    capasEl.innerHTML = '';

    // Initialize point objects
    const ptos: PointState[] = initialColors.map((hex, i) => {
      const rgb = hex2rgb(hex);
      const pos = disposicion()[i];
      const p: PointState = {
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
      return p;
    });
    ptosRef.current = ptos;

    // Create DOM buttons for each point
    ptos.forEach(p => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'ml-punto';
      el.dataset.i = String(p.i);
      el.setAttribute('aria-label', `Punto ${p.i + 1}`);
      capa.insertBefore(el, aro);
      p.el = el;
    });

    // Create DOM code list items
    ptos.forEach(p => {
      const li = document.createElement('li');
      li.innerHTML = `<button type="button" class="ml-fila" data-i="${p.i}"><i class="ml-chip"></i><code><span class="ml-r-pre">radial-gradient(</span>at <b data-xy></b>, <span class="ml-hex" data-hex></span><span class="ml-r-suf">, transparent ${CAPA}%)</span><span data-fin>${p.i === N - 1 ? ';' : ','}</span></code></button>`;
      capasEl.appendChild(li);
      p.fila = li.firstElementChild as HTMLElement;
      p.xy = li.querySelector('[data-xy]') as HTMLElement;
      p.hexEl = li.querySelector('[data-hex]') as HTMLElement;
      p.chip = li.querySelector('.ml-chip') as HTMLElement;
    });

    // WebGL Context setup
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
        return gl!.getShaderParameter(s, gl!.COMPILE_STATUS) ? s : null;
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
            ['u_res', 'u_t', 'u_p', 'u_c', 'u_s', 'u_m', 'u_soft', 'u_fluid', 'u_grano', 'u_estira', 'u_croma'].forEach(n => {
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
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        lienzo!.width = Math.round(W * dpr);
        lienzo!.height = Math.round(H * dpr);
        gl.viewport(0, 0, lienzo!.width, lienzo!.height);
      }
    }

    const bufP = new Float32Array(N * 2);
    const bufC = new Float32Array(N * 3);
    const bufS = new Float32Array(N * 2);
    const bufM = new Float32Array(N);

    function pinta() {
      if (!gl || !prog) return;
      const asp = W / H;
      ptos.forEach((p, i) => {
        bufP[i * 2] = p.px.x;
        bufP[i * 2 + 1] = 1 - p.py.x;
        bufC[i * 3] = p.cs[0].x;
        bufC[i * 3 + 1] = p.cs[1].x;
        bufC[i * 3 + 2] = p.cs[2].x;
        bufS[i * 2] = (p.tx - p.px.x) * asp;
        bufS[i * 2 + 1] = -(p.ty - p.py.x);
        bufM[i] = p.m.x;
      });
      gl.uniform2f(U.u_res!, lienzo!.width, lienzo!.height);
      gl.uniform1f(U.u_t!, tiempo);
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
      if (!q) tiempo += dt;
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
        if (!p.el || !p.chip) return;
        const x = (p.tx * W).toFixed(1) + 'px';
        const y = (p.ty * H).toFixed(1) + 'px';
        p.el.style.left = x;
        p.el.style.top = y;
        const c = rgb2hex([p.cs[0].x, p.cs[1].x, p.cs[2].x]);
        p.el.style.setProperty('--c', c);
        p.chip.style.setProperty('--c', c);
      });
      if (selec !== -1) colocaAro();
    }

    function cuadro(ts: number) {
      raf = 0;
      if (W <= 1 || H <= 1) {
        mide();
      }
      const dt = ultimoTs ? lim((ts - ultimoTs) / 1000, 0, 0.05) : 1 / 60;
      ultimoTs = ts;
      paso(dt);
      pinta();
      coloca();
      if (!quieto() || ptos.some(p => !enReposo(p.px) || !enReposo(p.py) || !enReposo(p.m) || p.cs.some(r => !enReposo(r)))) {
        raf = requestAnimationFrame(cuadro);
      } else {
        ultimoTs = 0;
      }
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

    function destella(p: PointState) {
      if (quieto() || !p.fila) return;
      p.fila.classList.remove('is-cambia');
      void p.fila.offsetWidth;
      p.fila.classList.add('is-cambia');
      setTimeout(() => p.fila?.classList.remove('is-cambia'), 850);
    }

    function pintaCodigo(destellar: boolean) {
      ptos.forEach(p => {
        if (!p.xy || !p.hexEl) return;
        const xy = xyDe(p);
        const hx = hexDe(p);
        const clave = xy + hx;
        if (p.xy.textContent !== xy) p.xy.textContent = xy;
        if (p.hexEl.textContent !== hx) p.hexEl.textContent = hx;
        if (clave !== p.claveCodigo) {
          const hubo = p.claveCodigo !== undefined;
          p.claveCodigo = clave;
          if (hubo && destellar) destella(p);
        }
      });
      if (!gl || !prog) {
        lienzo!.style.backgroundImage = ptos.map(p => `radial-gradient(at ${xyDe(p)}, ${hexDe(p)}, transparent ${CAPA}%)`).join(',');
        lienzo!.style.backgroundColor = baseColorRef.current;
      }
    }

    /* ── Aro de Tono HSL ────────────────────────────────────────────── */
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
        p.fila?.classList.toggle('is-sel', p.i === selec);
      });
    }

    function abreAro(i: number) {
      selec = i;
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
      pintaCodigo(false);
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
      pintaCodigo(false);
      despierta();
      if (selec === p.i) colocaAro();
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button > 0) return;
      const [x, y] = aPunto(e);

      if (selec !== -1) {
        const p = ptos[selec];
        const d = Math.hypot(x - p.tx * W, y - p.ty * H);
        if (d > 36 && d < 74) {
          girando = true;
          capa.setPointerCapture(e.pointerId);
          aro.classList.add('is-gira');
          giraAro(x, y);
          e.preventDefault();
          return;
        }
        if (d >= 74) cierraAro();
      }

      const btn = (e.target as HTMLElement).closest('.ml-punto') as HTMLElement | null;
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
        if (ptos[selec]) destella(ptos[selec]);
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
      } else if (a.moved || a.fondo) {
        destella(a.p);
      }
      despierta();
    };

    capa.addEventListener('pointerdown', onPointerDown);
    capa.addEventListener('pointermove', onPointerMove);
    capa.addEventListener('pointerup', onPointerUp);
    capa.addEventListener('pointercancel', onPointerUp);

    // Click on code rows highlights or opens the corresponding point
    const onFilaClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('.ml-fila') as HTMLElement | null;
      if (!btn) return;
      const i = Number(btn.dataset.i);
      if (selec === i) cierraAro();
      else abreAro(i);
      destella(ptos[i]);
    };
    capasEl.addEventListener('click', onFilaClick);

    // Azar & Reset logic
    const azar = () => {
      soundFX.playClick();
      const r = 0.12;
      ptos.forEach(p => {
        p.obj = [
          lim(r + Math.random() * (1 - 2 * r), 0.05, 0.95),
          lim(r + Math.random() * (1 - 2 * r), 0.05, 0.95),
        ];
      });
      // Barajar colores cíclicamente
      const shift = 1 + Math.floor(Math.random() * 4);
      const prevColores = ptos.map(p => ({ rgb: p.rgb.slice() as [number, number, number], hsl: p.hsl.slice() as [number, number, number] }));
      ptos.forEach((p, idx) => {
        const o = prevColores[(idx + shift) % N];
        p.rgb = o.rgb;
        p.hsl = o.hsl;
      });
      if (selec !== -1) cierraAro();
      pintaCodigo(true);
      despierta();
    };
    triggerAzarRef.current = azar;

    const restablecer = () => {
      soundFX.playClick();
      const presetActive = MOXEN_MALLA_PRESETS.find(p => p.id === activePresetRef.current) || MOXEN_MALLA_PRESETS[0];
      baseColorRef.current = presetActive.base;
      baseEl.textContent = presetActive.base;
      ptos.forEach((p, idx) => {
        const rgb = hex2rgb(presetActive.colors[idx]);
        p.obj = disposicion()[idx].slice() as [number, number];
        p.rgb = rgb;
        p.hsl = rgb2hsl(rgb[0], rgb[1], rgb[2]);
      });
      if (selec !== -1) cierraAro();
      pintaCodigo(true);
      despierta();
    };
    triggerResetRef.current = restablecer;

    const loadColors = (newColors: string[], newBase: string) => {
      baseColorRef.current = newBase;
      baseEl.textContent = newBase;
      ptos.forEach((p, idx) => {
        const rgb = hex2rgb(newColors[idx]);
        p.rgb = rgb;
        p.hsl = rgb2hsl(rgb[0], rgb[1], rgb[2]);
      });
      pintaCodigo(true);
      despierta();
    };
    loadColorsRef.current = loadColors;

    // Observe Resize
    const resizeObserver = new ResizeObserver(() => {
      mide();
      pinta();
      coloca();
    });
    resizeObserver.observe(capa);

    // Initial first frame render
    mide();
    pintaCodigo(false);
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
      capasEl.removeEventListener('click', onFilaClick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Handle Preset Switching
  const handleSelectPreset = useCallback((presetId: string) => {
    soundFX.playClick();
    setActivePreset(presetId);
    activePresetRef.current = presetId;
    const targetPreset = MOXEN_MALLA_PRESETS.find(p => p.id === presetId);
    if (targetPreset && loadColorsRef.current) {
      loadColorsRef.current(targetPreset.colors, targetPreset.base);
    }
  }, []);

  // Handle Copy CSS
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

  // Handle Apply to System (Option A)
  const handleApplyToSystem = () => {
    soundFX.playLevelUp?.();
    if (!getCssRef.current) return;
    const code = getCssRef.current();
    const currPreset = MOXEN_MALLA_PRESETS.find(p => p.id === activePreset);
    
    // Extract background-image & background-color
    const bgColMatch = code.match(/background-color:\s*([^;]+);/);
    const bgImgMatch = code.match(/background-image:\s*([\s\S]+?);/);

    const aura = {
      name: currPreset ? currPreset.name : 'Malla Personalizada',
      backgroundColor: bgColMatch ? bgColMatch[1].trim() : '#050b1a',
      backgroundImage: bgImgMatch ? bgImgMatch[1].trim() : '',
    };

    if (onApplyToSystem) {
      onApplyToSystem(aura);
    }
    setApplyFeedback(true);
    setTimeout(() => setApplyFeedback(false), 3000);
  };

  const handleResetSystemAura = () => {
    soundFX.playClick();
    if (onResetSystem) {
      onResetSystem();
    }
    setApplyFeedback(false);
  };

  return (
    <div className={`moxen-malla-root space-y-4 ${className}`}>
      {/* ── BARRA SUPERIOR DE PRESETS SCI-FI (OPCIÓN C) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#00152b] rounded-2xl border border-cyan-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
              Atmósfera Cuántica · Moxen Malla
            </span>
            <span className="text-xs font-anton tracking-wide text-white block">
              Elige un Preset o diseña tu propia aura en WebGL
            </span>
          </div>
        </div>

        {/* Preset Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {MOXEN_MALLA_PRESETS.map(p => {
            const isSelected = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p.id)}
                className={`chicle-btn px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold tracking-wider transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.5)] font-black'
                    : 'bg-[#000d1c] border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40'
                }`}
                title={p.desc}
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/40"
                  style={{ background: p.colors[0] }}
                />
                <span>{p.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── LIENZO INTERACTIVO MALLA (ESCENA) ── */}
      <div
        ref={containerRef}
        className={`ml-escena relative border border-cyan-500/40 shadow-[0_15px_40px_rgba(0,240,255,0.12)] transition-all ${
          isFullscreen 
            ? 'fixed inset-4 z-50 rounded-3xl min-h-[90vh] shadow-[0_0_60px_rgba(0,240,255,0.3)]' 
            : 'h-[460px] sm:h-[480px]'
        }`}
      >
        {/* WebGL Canvas */}
        <canvas ref={canvasRef} className="ml-lienzo" aria-hidden="true" />

        {/* Interactive Pointer Overlay Layer */}
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

        {/* Botón Flotante para Alternar Pantalla Completa */}
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setIsFullscreen(!isFullscreen);
          }}
          className="chicle-btn absolute top-3 right-3 z-30 p-2 rounded-xl bg-black/60 hover:bg-black/80 border border-cyan-500/40 text-cyan-300 hover:text-white backdrop-blur-md transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.2)]"
          title={isFullscreen ? 'Reducir tamaño' : 'Ver a pantalla completa'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Panel de Vidrio y Código CSS Reactivo */}
        <aside className="ml-panel" aria-label="Degradado en código">
          <header className="ml-cab">
            <span className="ml-etiqueta">Shader WebGL</span>
            <h3>
              <Sparkles className="w-4 h-4 text-cyan-400 inline" />
              Malla Cuántica
            </h3>
            <p>Arrastra los puntos o toca uno para afinar su tono en el aro.</p>
          </header>

          <div className="ml-codigo">
            <p className="ml-linea ml-fija">
              <span className="ml-k">background-color</span>: <span ref={baseElRef} className="ml-v">#030712</span>;
            </p>
            <p className="ml-linea ml-fija">
              <span className="ml-k">background-image</span>:
            </p>
            <ol ref={capasElRef} className="ml-capas" />
          </div>

          {/* Acciones del Lienzo */}
          <div className="ml-acciones">
            <button
              type="button"
              className="ml-btn chicle-btn"
              onClick={() => triggerAzarRef.current?.()}
              title="Barajar colores y posiciones"
            >
              <Shuffle className="w-4 h-4" />
              <span>Azar</span>
            </button>

            <button
              type="button"
              className="ml-btn ml-btn-ico chicle-btn"
              onClick={() => triggerResetRef.current?.()}
              title="Restablecer puntos del preset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              className={`ml-btn ml-btn-prin chicle-btn ${copyFeedback ? 'is-copiado' : ''}`}
              onClick={handleCopyCss}
              title="Copiar código CSS al portapapeles"
            >
              <span className="ml-b-ico" aria-hidden="true">
                {copyFeedback ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </span>
              <span className="ml-b-txt">
                <span>{copyFeedback ? '¡Copiado!' : 'Copiar CSS'}</span>
              </span>
            </button>
          </div>
        </aside>

        {/* Pista Inferior */}
        <p className="ml-pista">
          <span className="ml-p-largo">Toca y arrastra un punto · Pulsa un punto para desplegar el aro de color</span>
          <span className="ml-p-corto">Arrastra o pulsa un punto</span>
        </p>
      </div>

      {/* ── BARRA DE APLICACIÓN A LA ATMÓSFERA DEL SISTEMA (OPCIÓN A) ── */}
      <div className="p-4 bg-gradient-to-r from-[#00152b] via-[#002244] to-[#00152b] rounded-2xl border border-cyan-500/40 shadow-[0_0_25px_rgba(0,240,255,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Aura y Atmósfera Activa del Sistema
            </h4>
            {activeSystemAuraName && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 border border-cyan-400/50 text-cyan-300 font-bold">
                Activa: {activeSystemAuraName}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300">
            Aplica este gradiente de malla como la atmósfera de fondo de toda la aplicación.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {activeSystemAuraName && (
            <button
              type="button"
              onClick={handleResetSystemAura}
              className="chicle-btn px-3 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white bg-[#000d1c] border border-slate-700 hover:border-slate-500 transition-all cursor-pointer"
            >
              Restablecer Predeterminado
            </button>
          )}

          <button
            type="button"
            onClick={handleApplyToSystem}
            className={`chicle-btn px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border cursor-pointer ${
              applyFeedback
                ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.6)]'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:brightness-110 hover:shadow-[0_0_30px_rgba(0,240,255,0.7)]'
            }`}
          >
            {applyFeedback ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black stroke-[2.5]" />
                <span>¡Atmósfera Aplicada!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-black" />
                <span>Aplicar a la App</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoxenMalla;
