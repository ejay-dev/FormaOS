'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CtaLink {
  label: string;
  href: string;
}

interface EnterpriseShaderHeroProps {
  badgeText?: string;
  headline: {
    line1: string;
    line2: string;
  };
  subtitle: string;
  primaryCta?: CtaLink;
  secondaryCta?: CtaLink;
  className?: string;
}

interface PointerSnapshot {
  move: [number, number];
  first: [number, number];
  count: number;
  coords: number[];
}

class WebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram | null = null;
  private vertexShader: WebGLShader | null = null;
  private fragmentShader: WebGLShader | null = null;
  private buffer: WebGLBuffer | null = null;
  private uniforms: {
    resolution: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    move: WebGLUniformLocation | null;
    touch: WebGLUniformLocation | null;
    pointerCount: WebGLUniformLocation | null;
    pointers: WebGLUniformLocation | null;
  } = {
    resolution: null,
    time: null,
    move: null,
    touch: null,
    pointerCount: null,
    pointers: null,
  };
  private shaderSource: string;

  private readonly vertexSource = `#version 300 es
precision highp float;
in vec4 position;
void main() { gl_Position = position; }`;

  private readonly vertices = [-1, 1, -1, -1, 1, 1, 1, -1];

  constructor(canvas: HTMLCanvasElement, shaderSource: string) {
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      throw new Error('WebGL2 unavailable');
    }
    this.canvas = canvas;
    this.gl = gl;
    this.shaderSource = shaderSource;
  }

  private compile(shader: WebGLShader, source: string) {
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(this.gl.getShaderInfoLog(shader) ?? 'Shader compile failed');
    }
  }

  setup() {
    this.vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    if (!this.vertexShader || !this.fragmentShader) {
      throw new Error('Failed to create shaders');
    }

    this.compile(this.vertexShader, this.vertexSource);
    this.compile(this.fragmentShader, this.shaderSource);

    this.program = this.gl.createProgram();
    if (!this.program) throw new Error('Failed to create program');

    this.gl.attachShader(this.program, this.vertexShader);
    this.gl.attachShader(this.program, this.fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      throw new Error(this.gl.getProgramInfoLog(this.program) ?? 'Program link failed');
    }
  }

  init() {
    if (!this.program) return;

    this.buffer = this.gl.createBuffer();
    if (!this.buffer) throw new Error('Failed to create buffer');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);

    const position = this.gl.getAttribLocation(this.program, 'position');
    this.gl.enableVertexAttribArray(position);
    this.gl.vertexAttribPointer(position, 2, this.gl.FLOAT, false, 0, 0);

    this.uniforms = {
      resolution: this.gl.getUniformLocation(this.program, 'resolution'),
      time: this.gl.getUniformLocation(this.program, 'time'),
      move: this.gl.getUniformLocation(this.program, 'move'),
      touch: this.gl.getUniformLocation(this.program, 'touch'),
      pointerCount: this.gl.getUniformLocation(this.program, 'pointerCount'),
      pointers: this.gl.getUniformLocation(this.program, 'pointers'),
    };
  }

  resize(pixelWidth: number, pixelHeight: number) {
    this.gl.viewport(0, 0, pixelWidth, pixelHeight);
  }

  render(now: number, pointer: PointerSnapshot) {
    if (!this.program) return;

    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);

    this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    this.gl.uniform1f(this.uniforms.time, now * 1e-3);
    this.gl.uniform2f(this.uniforms.move, pointer.move[0], pointer.move[1]);
    this.gl.uniform2f(this.uniforms.touch, pointer.first[0], pointer.first[1]);
    this.gl.uniform1i(this.uniforms.pointerCount, pointer.count);
    this.gl.uniform2fv(this.uniforms.pointers, pointer.coords.length ? pointer.coords : [0, 0]);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  destroy() {
    if (this.program) {
      if (this.vertexShader) {
        this.gl.detachShader(this.program, this.vertexShader);
        this.gl.deleteShader(this.vertexShader);
      }
      if (this.fragmentShader) {
        this.gl.detachShader(this.program, this.fragmentShader);
        this.gl.deleteShader(this.fragmentShader);
      }
      this.gl.deleteProgram(this.program);
    }
    if (this.buffer) this.gl.deleteBuffer(this.buffer);
    this.program = null;
    this.vertexShader = null;
    this.fragmentShader = null;
    this.buffer = null;
  }
}

class PointerHandler {
  private pointers = new Map<number, [number, number]>();
  private delta: [number, number] = [0, 0];
  private last: [number, number] = [0, 0];
  private cleanupFns: Array<() => void> = [];

  constructor(private element: HTMLCanvasElement, private dpr: number) {
    const onDown = (e: PointerEvent) => {
      this.pointers.set(e.pointerId, this.map(e.clientX, e.clientY));
      this.element.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.last = this.map(e.clientX, e.clientY);
      this.pointers.set(e.pointerId, this.last);
      this.delta = [this.delta[0] + e.movementX, this.delta[1] + e.movementY];
    };
    const onUp = (e: PointerEvent) => {
      if (this.pointers.size === 1) this.last = this.first;
      this.pointers.delete(e.pointerId);
    };

    this.addListener('pointerdown', onDown);
    this.addListener('pointermove', onMove);
    this.addListener('pointerup', onUp);
    this.addListener('pointercancel', onUp);
    this.addListener('pointerleave', onUp);
  }

  private addListener<K extends keyof HTMLElementEventMap>(type: K, handler: (event: HTMLElementEventMap[K]) => void) {
    this.element.addEventListener(type, handler as EventListener);
    this.cleanupFns.push(() => this.element.removeEventListener(type, handler as EventListener));
  }

  private map(clientX: number, clientY: number): [number, number] {
    const rect = this.element.getBoundingClientRect();
    const x = (clientX - rect.left) * this.dpr;
    const y = (rect.height - (clientY - rect.top)) * this.dpr;
    return [x, y];
  }

  updateScale(dpr: number) {
    this.dpr = dpr;
  }

  get count() {
    return this.pointers.size;
  }

  get move(): [number, number] {
    return this.delta;
  }

  get first(): [number, number] {
    const firstPointer = this.pointers.values().next().value as [number, number] | undefined;
    return firstPointer ?? this.last;
  }

  get coords(): number[] {
    if (!this.pointers.size) return [0, 0];
    return Array.from(this.pointers.values()).flat();
  }

  destroy() {
    for (const cleanup of this.cleanupFns) cleanup();
    this.cleanupFns = [];
    this.pointers.clear();
  }
}

const ENTERPRISE_SHADER_SOURCE = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
uniform vec2 move;
uniform vec2 touch;
uniform int pointerCount;
uniform vec2 pointers[10];
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)

float rnd(vec2 p) {
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}

float noise(in vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  float a=rnd(i), b=rnd(i+vec2(1,0)), c=rnd(i+vec2(0,1)), d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}

float fbm(vec2 p) {
  float t=.0, a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for (int i=0; i<5; i++) {
    t+=a*noise(p);
    p*=2.*m;
    a*=.5;
  }
  return t;
}

float clouds(vec2 p) {
  float d=1., t=.0;
  for (float i=.0; i<3.; i++) {
    float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
    t=mix(t,d,a);
    d=a;
    p*=2./(i+1.);
  }
  return t;
}

void main(void) {
  vec2 uv=(FC-.5*R)/MN, st=uv*vec2(2,1);
  vec3 col=vec3(0.0);
  vec2 pointerInfluence = touch / max(resolution, vec2(1.0));
  float bg=clouds(vec2(st.x+T*.42 + pointerInfluence.x*.25,-st.y + pointerInfluence.y*.15));
  uv*=1.-.22*(sin(T*.18)*.5+.5);

  for (float i=1.; i<11.; i++) {
    uv+=.1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.42+.1*uv.x);
    vec2 p=uv;
    float d=length(p);
    vec3 palette = vec3(0.19, 0.72, 0.98) + vec3(0.18, 0.10, 0.35) * sin(i + T*0.2);
    col += (.0012/max(d,0.02)) * (palette + 0.7);
    float b=noise(i+p+bg*1.731);
    col += .0018*b/length(max(p,vec2(b*p.x*.02,p.y)));
    col = mix(col, vec3(bg*.04,bg*.14,bg*.22), min(1.0,d*0.75));
  }

  float vignette = smoothstep(1.45, 0.22, length(st));
  col *= vignette;
  O=vec4(col,1.0);
}`;

export function EnterpriseShaderHero({
  badgeText = 'Enterprise Compliance Intelligence',
  headline,
  subtitle,
  primaryCta,
  secondaryCta,
  className,
}: EnterpriseShaderHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    let rafId = 0;
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let renderer: WebGLRenderer | null = null;
    let pointers: PointerHandler | null = null;

    const resize = () => {
      if (!canvas || !container || !renderer || !pointers) return;
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      pointers.updateScale(dpr);
      renderer.resize(canvas.width, canvas.height);
    };

    try {
      renderer = new WebGLRenderer(canvas, ENTERPRISE_SHADER_SOURCE);
      renderer.setup();
      renderer.init();
      pointers = new PointerHandler(canvas, dpr);
      resize();

      const render = (now: number) => {
        if (!renderer || !pointers) return;
        renderer.render(now, {
          move: pointers.move,
          first: pointers.first,
          count: pointers.count,
          coords: pointers.coords,
        });
        rafId = requestAnimationFrame(render);
      };
      rafId = requestAnimationFrame(render);

      const resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(container);
      window.addEventListener('resize', resize, { passive: true });

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(rafId);
        pointers?.destroy();
        renderer?.destroy();
      };
    } catch {
      return undefined;
    }
  }, []);

  return (
    <section className={cn('mk-section relative py-20 sm:py-24', className)}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div
          ref={containerRef}
          className="relative min-h-[560px] overflow-hidden rounded-3xl border border-cyan-300/15 bg-black/70 shadow-[0_22px_70px_rgba(6,182,212,0.18)]"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full touch-none"
            aria-hidden
          />

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(124,58,237,0.22)_0%,transparent_44%),radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.2)_0%,transparent_50%)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/22 via-slate-950/45 to-slate-950/78" />

          <div className="relative z-10 flex min-h-[560px] flex-col items-center justify-center px-6 text-center sm:px-10 lg:px-14">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-5 py-2.5 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
                {badgeText}
              </span>
            </div>

            <h2 className="max-w-5xl text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              <span>{headline.line1}</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300 bg-clip-text text-transparent">
                {headline.line2}
              </span>
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-200 sm:text-lg lg:text-xl">
              {subtitle}
            </p>

            {(primaryCta || secondaryCta) && (
              <div className="mt-10 flex w-full max-w-xl flex-col justify-center gap-3 sm:flex-row sm:gap-4">
                {primaryCta && (
                  <Link
                    href={primaryCta.href}
                    className="mk-btn mk-btn-primary min-h-[48px] justify-center px-8 py-4 text-base sm:text-lg"
                  >
                    {primaryCta.label}
                  </Link>
                )}
                {secondaryCta && (
                  <Link
                    href={secondaryCta.href}
                    className="mk-btn mk-btn-secondary min-h-[48px] justify-center px-8 py-4 text-base sm:text-lg"
                  >
                    {secondaryCta.label}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default EnterpriseShaderHero;
