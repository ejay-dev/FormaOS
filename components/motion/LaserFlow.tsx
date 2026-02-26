'use client';

import { useEffect, useRef, useCallback, memo } from 'react';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { useDeviceTier } from '@/lib/device-tier';

/**
 * LaserFlow — WebGL beam effect for premium hero backgrounds.
 *
 * Stability guarantees:
 * - Single init guard (initializedRef) prevents Strict Mode double-invoke
 * - Props stored in refs — effect never re-runs from prop changes
 * - Resize throttled to 100ms with 2px deadzone
 * - Adaptive DPR changes capped at once per 3s with smooth crossfade
 * - Context loss/restore handled gracefully with fade-in
 * - Pause/resume via IO + visibilitychange (never unmounts)
 *
 * Performance:
 * - Pauses when off-screen (IntersectionObserver)
 * - Pauses when tab hidden (visibilitychange)
 * - Respects prefers-reduced-motion (static gradient fallback)
 * - Mobile low-tier → static gradient fallback (no WebGL)
 * - Adaptive DPR downscaling on sustained low FPS
 */

const VERT = `
precision highp float;
attribute vec3 position;
void main(){
  gl_Position = vec4(position, 1.0);
}
`;

const FRAG = `
#ifdef GL_ES
#extension GL_OES_standard_derivatives : enable
#endif
precision highp float;
precision mediump int;

uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform float uWispDensity;
uniform float uTiltScale;
uniform float uFlowTime;
uniform float uFogTime;
uniform float uBeamXFrac;
uniform float uBeamYFrac;
uniform float uFlowSpeed;
uniform float uVLenFactor;
uniform float uHLenFactor;
uniform float uFogIntensity;
uniform float uFogScale;
uniform float uWSpeed;
uniform float uWIntensity;
uniform float uFlowStrength;
uniform float uDecay;
uniform float uFalloffStart;
uniform float uFogFallSpeed;
uniform vec3 uColor;
uniform float uFade;

#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define EPS 1e-6
#define EDGE_SOFT (DT_LOCAL*4.0)
#define DT_LOCAL 0.0038
#define TAP_RADIUS 6
#define R_H 150.0
#define R_V 150.0
#define FLARE_HEIGHT 16.0
#define FLARE_AMOUNT 8.0
#define FLARE_EXP 2.0
#define TOP_FADE_START 0.1
#define TOP_FADE_EXP 1.0
#define FLOW_PERIOD 0.5
#define FLOW_SHARPNESS 1.5
#define W_BASE_X 1.5
#define W_LAYER_GAP 0.25
#define W_LANES 10
#define W_SIDE_DECAY 0.5
#define W_HALF 0.01
#define W_AA 0.15
#define W_CELL 20.0
#define W_SEG_MIN 0.01
#define W_SEG_MAX 0.55
#define W_CURVE_AMOUNT 15.0
#define W_CURVE_RANGE (FLARE_HEIGHT - 3.0)
#define W_BOTTOM_EXP 10.0
#define FOG_ON 1
#define FOG_CONTRAST 1.2
#define FOG_SPEED_U 0.1
#define FOG_SPEED_V -0.1
#define FOG_OCTAVES 5
#define FOG_BOTTOM_BIAS 0.8
#define FOG_TILT_TO_MOUSE 0.05
#define FOG_TILT_DEADZONE 0.01
#define FOG_TILT_MAX_X 0.35
#define FOG_TILT_SHAPE 1.5
#define FOG_BEAM_MIN 0.0
#define FOG_BEAM_MAX 0.75
#define FOG_MASK_GAMMA 0.5
#define FOG_EXPAND_SHAPE 12.2
#define FOG_EDGE_MIX 0.5
#define HFOG_EDGE_START 0.20
#define HFOG_EDGE_END 0.98
#define HFOG_EDGE_GAMMA 1.4
#define HFOG_Y_RADIUS 25.0
#define HFOG_Y_SOFT 60.0
#define EDGE_X0 0.22
#define EDGE_X1 0.995
#define EDGE_X_GAMMA 1.25
#define EDGE_LUMA_T0 0.0
#define EDGE_LUMA_T1 2.0
#define DITHER_STRENGTH 1.0

float g(float x){return x<=0.00031308?12.92*x:1.055*pow(x,1.0/2.4)-0.055;}
float bs(vec2 p,vec2 q,float powr){
  float d=distance(p,q),f=powr*uFalloffStart,r=(f*f)/(d*d+EPS);
  return powr*min(1.0,r);
}
float bsa(vec2 p,vec2 q,float powr,vec2 s){
  vec2 d=p-q; float dd=(d.x*d.x)/(s.x*s.x)+(d.y*d.y)/(s.y*s.y),f=powr*uFalloffStart,r=(f*f)/(dd+EPS);
  return powr*min(1.0,r);
}
float tri01(float x){float f=fract(x);return 1.0-abs(f*2.0-1.0);}
float tauWf(float t,float tmin,float tmax){float a=smoothstep(tmin,tmin+EDGE_SOFT,t),b=1.0-smoothstep(tmax-EDGE_SOFT,tmax,t);return max(0.0,a*b);}
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+34.123);return fract(p.x*p.y);}
float vnoise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  float a=h21(i),b=h21(i+vec2(1,0)),c=h21(i+vec2(0,1)),d=h21(i+vec2(1,1));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm2(vec2 p){
  float v=0.0,amp=0.6; mat2 m=mat2(0.86,0.5,-0.5,0.86);
  for(int i=0;i<FOG_OCTAVES;++i){v+=amp*vnoise(p); p=m*p*2.03+17.1; amp*=0.52;}
  return v;
}
float rGate(float x,float l){float a=smoothstep(0.0,W_AA,x),b=1.0-smoothstep(l,l+W_AA,x);return max(0.0,a*b);}
float flareY(float y){float t=clamp(1.0-(clamp(y,0.0,FLARE_HEIGHT)/max(FLARE_HEIGHT,EPS)),0.0,1.0);return pow(t,FLARE_EXP);}

float vWisps(vec2 uv,float topF){
  float y=uv.y,yf=(y+uFlowTime*uWSpeed)/W_CELL;
  float dRaw=clamp(uWispDensity,0.0,2.0),d=dRaw<=0.0?1.0:dRaw;
  float lanesF=floor(float(W_LANES)*min(d,1.0)+0.5);
  int lanes=int(max(1.0,lanesF));
  float sp=min(d,1.0),ep=max(d-1.0,0.0);
  float fm=flareY(max(y,0.0)),rm=clamp(1.0-(y/max(W_CURVE_RANGE,EPS)),0.0,1.0),cm=fm*rm;
  const float G=0.05; float xS=1.0+(FLARE_AMOUNT*W_CURVE_AMOUNT*G)*cm;
  float sPix=clamp(y/R_V,0.0,1.0),bGain=pow(1.0-sPix,W_BOTTOM_EXP),sum=0.0;
  for(int s=0;s<2;++s){
    float sgn=s==0?-1.0:1.0;
    for(int i=0;i<W_LANES;++i){
      if(i>=lanes) break;
      float off=W_BASE_X+float(i)*W_LAYER_GAP,xc=sgn*(off*xS);
      float dx=abs(uv.x-xc),lat=1.0-smoothstep(W_HALF,W_HALF+W_AA,dx),amp=exp(-off*W_SIDE_DECAY);
      float seed=h21(vec2(off,sgn*17.0)),yf2=yf+seed*7.0,ci=floor(yf2),fy=fract(yf2);
      float seg=mix(W_SEG_MIN,W_SEG_MAX,h21(vec2(ci,off*2.3)));
      float spR=h21(vec2(ci,off+sgn*31.0)),seg1=rGate(fy,seg)*step(spR,sp);
      if(ep>0.0){float spR2=h21(vec2(ci*3.1+7.0,off*5.3+sgn*13.0)); float f2=fract(fy+0.5); seg1+=rGate(f2,seg*0.9)*step(spR2,ep);}
      sum+=amp*lat*seg1;
    }
  }
  float span=smoothstep(-3.0,0.0,y)*(1.0-smoothstep(R_V-6.0,R_V,y));
  return uWIntensity*sum*topF*bGain*span;
}

void mainImage(out vec4 fc,in vec2 frag){
  vec2 C=iResolution.xy*.5; float invW=1.0/max(C.x,1.0);
  float sc=512.0/iResolution.x*.4;
  vec2 uv=(frag-C)*sc,off=vec2(uBeamXFrac*iResolution.x*sc,uBeamYFrac*iResolution.y*sc);
  vec2 uvc = uv - off;
  float a=0.0,b=0.0;
  float basePhase=1.5*PI+uDecay*.5; float tauMin=basePhase-uDecay; float tauMax=basePhase;
  float cx=clamp(uvc.x/(R_H*uHLenFactor),-1.0,1.0),tH=clamp(TWO_PI-acos(cx),tauMin,tauMax);
  for(int k=-TAP_RADIUS;k<=TAP_RADIUS;++k){
    float tu=tH+float(k)*DT_LOCAL,wt=tauWf(tu,tauMin,tauMax); if(wt<=0.0) continue;
    float spd=max(abs(sin(tu)),0.02),u=clamp((basePhase-tu)/max(uDecay,EPS),0.0,1.0),env=pow(1.0-abs(u*2.0-1.0),0.8);
    vec2 p=vec2((R_H*uHLenFactor)*cos(tu),0.0);
    a+=wt*bs(uvc,p,env*spd);
  }
  float yPix=uvc.y,cy=clamp(-yPix/(R_V*uVLenFactor),-1.0,1.0),tV=clamp(TWO_PI-acos(cy),tauMin,tauMax);
  for(int k=-TAP_RADIUS;k<=TAP_RADIUS;++k){
    float tu=tV+float(k)*DT_LOCAL,wt=tauWf(tu,tauMin,tauMax); if(wt<=0.0) continue;
    float yb=(-R_V)*cos(tu),s=clamp(yb/R_V,0.0,1.0),spd=max(abs(sin(tu)),0.02);
    float env=pow(1.0-s,0.6)*spd;
    float cap=1.0-smoothstep(TOP_FADE_START,1.0,s); cap=pow(cap,TOP_FADE_EXP); env*=cap;
    float ph=s/max(FLOW_PERIOD,EPS)+uFlowTime*uFlowSpeed;
    float fl=pow(tri01(ph),FLOW_SHARPNESS);
    env*=mix(1.0-uFlowStrength,1.0,fl);
    float yp=(-R_V*uVLenFactor)*cos(tu),m=pow(smoothstep(FLARE_HEIGHT,0.0,yp),FLARE_EXP),wx=1.0+FLARE_AMOUNT*m;
    vec2 sig=vec2(wx,1.0),p=vec2(0.0,yp);
    float mask=step(0.0,yp);
    b+=wt*bsa(uvc,p,mask*env,sig);
  }
  float sPix=clamp(yPix/R_V,0.0,1.0),topA=pow(1.0-smoothstep(TOP_FADE_START,1.0,sPix),TOP_FADE_EXP);
  float L=a+b*topA;
  float w=vWisps(vec2(uvc.x,yPix),topA);
  float fog=0.0;
#if FOG_ON
  vec2 fuv=uvc*uFogScale;
  float mAct=step(1.0,length(iMouse.xy)),nx=((iMouse.x-C.x)*invW)*mAct;
  float ax = abs(nx);
  float stMag = mix(ax, pow(ax, FOG_TILT_SHAPE), 0.35);
  float st = sign(nx) * stMag * uTiltScale;
  st = clamp(st, -FOG_TILT_MAX_X, FOG_TILT_MAX_X);
  vec2 dir=normalize(vec2(st,1.0));
  fuv+=uFogTime*uFogFallSpeed*dir;
  vec2 prp=vec2(-dir.y,dir.x);
  fuv+=prp*(0.08*sin(dot(uvc,prp)*0.08+uFogTime*0.9));
  float n=fbm2(fuv+vec2(fbm2(fuv+vec2(7.3,2.1)),fbm2(fuv+vec2(-3.7,5.9)))*0.6);
  n=pow(clamp(n,0.0,1.0),FOG_CONTRAST);
  float pixW = 1.0 / max(iResolution.y, 1.0);
#ifdef GL_OES_standard_derivatives
  float wL = max(fwidth(L), pixW);
#else
  float wL = pixW;
#endif
  float m0=pow(smoothstep(FOG_BEAM_MIN - wL, FOG_BEAM_MAX + wL, L),FOG_MASK_GAMMA);
  float bm=1.0-pow(1.0-m0,FOG_EXPAND_SHAPE); bm=mix(bm*m0,bm,FOG_EDGE_MIX);
  float yP=1.0-smoothstep(HFOG_Y_RADIUS,HFOG_Y_RADIUS+HFOG_Y_SOFT,abs(yPix));
  float nxF=abs((frag.x-C.x)*invW),hE=1.0-smoothstep(HFOG_EDGE_START,HFOG_EDGE_END,nxF); hE=pow(clamp(hE,0.0,1.0),HFOG_EDGE_GAMMA);
  float hW=mix(1.0,hE,clamp(yP,0.0,1.0));
  float bBias=mix(1.0,1.0-sPix,FOG_BOTTOM_BIAS);
  float browserFogIntensity = uFogIntensity;
  browserFogIntensity *= 1.8;
  float radialFade = 1.0 - smoothstep(0.0, 0.7, length(uvc) / 120.0);
  float safariFog = n * browserFogIntensity * bBias * bm * hW * radialFade;
  fog = safariFog;
#endif
  float LF=L+fog;
  float dith=(h21(frag)-0.5)*(DITHER_STRENGTH/255.0);
  float tone=g(LF+w);
  vec3 col=tone*uColor+dith;
  float alpha=clamp(g(L+w*0.6)+dith*0.6,0.0,1.0);
  float nxE=abs((frag.x-C.x)*invW),xF=pow(clamp(1.0-smoothstep(EDGE_X0,EDGE_X1,nxE),0.0,1.0),EDGE_X_GAMMA);
  float scene=LF+max(0.0,w)*0.5,hi=smoothstep(EDGE_LUMA_T0,EDGE_LUMA_T1,scene);
  float eM=mix(xF,1.0,hi);
  col*=eM; alpha*=eM;
  col*=uFade; alpha*=uFade;
  fc=vec4(col,alpha);
}

void main(){
  vec4 fc;
  mainImage(fc, gl_FragCoord.xy);
  gl_FragColor = fc;
}
`;

interface LaserFlowProps {
  color?: string;
  horizontalBeamOffset?: number;
  verticalBeamOffset?: number;
  flowSpeed?: number;
  verticalSizing?: number;
  horizontalSizing?: number;
  fogIntensity?: number;
  fogScale?: number;
  wispDensity?: number;
  wispSpeed?: number;
  wispIntensity?: number;
  flowStrength?: number;
  decay?: number;
  falloffStart?: number;
  fogFallSpeed?: number;
  className?: string;
}

/** Debug overlay state — activated via ?laserDebug=1 */
interface DebugState {
  status: 'mounting' | 'running' | 'paused' | 'contextLost';
  fps: number;
  dpr: number;
  resolution: string;
  frameCount: number;
}

function LaserFlowInner({
  color = '#8B5CF6',
  horizontalBeamOffset = 0.1,
  verticalBeamOffset = 0.0,
  flowSpeed = 0.35,
  verticalSizing = 2.0,
  horizontalSizing = 0.5,
  fogIntensity = 0.45,
  fogScale = 0.3,
  wispDensity = 1,
  wispSpeed = 15.0,
  wispIntensity = 5.0,
  flowStrength = 0.25,
  decay = 1.1,
  falloffStart = 1.2,
  fogFallSpeed = 0.6,
  className,
}: LaserFlowProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const tierConfig = useDeviceTier();

  // Store props in refs so the effect never re-runs from prop changes
  const propsRef = useRef({
    color, horizontalBeamOffset, verticalBeamOffset, flowSpeed,
    verticalSizing, horizontalSizing, fogIntensity, fogScale,
    wispDensity, wispSpeed, wispIntensity, flowStrength,
    decay, falloffStart, fogFallSpeed,
  });
  propsRef.current = {
    color, horizontalBeamOffset, verticalBeamOffset, flowSpeed,
    verticalSizing, horizontalSizing, fogIntensity, fogScale,
    wispDensity, wispSpeed, wispIntensity, flowStrength,
    decay, falloffStart, fogFallSpeed,
  };

  // Strict Mode guard — prevent double init
  const initializedRef = useRef(false);

  // Debug state ref (written from RAF loop, read by debug overlay)
  const debugRef = useRef<DebugState>({
    status: 'mounting',
    fps: 0,
    dpr: 1,
    resolution: '0x0',
    frameCount: 0,
  });
  const debugOverlayRef = useRef<HTMLDivElement>(null);

  // Check for debug mode
  const debugEnabled = useRef(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      debugEnabled.current = new URLSearchParams(window.location.search).has('laserDebug');
    }
  }, []);

  // Update debug overlay DOM directly (no React re-renders)
  const updateDebugOverlay = useCallback(() => {
    const el = debugOverlayRef.current;
    if (!el || !debugEnabled.current) return;
    const d = debugRef.current;
    el.style.display = 'block';
    el.textContent = `LaserFlow: ${d.status} | FPS: ${d.fps.toFixed(0)} | DPR: ${d.dpr.toFixed(2)} | ${d.resolution} | frames: ${d.frameCount}`;
  }, []);

  // Mobile low-power or reduced motion → static fallback
  const useFallback = prefersReduced || tierConfig.tier === 'low';

  useEffect(() => {
    if (useFallback) return;
    const mount = mountRef.current;
    if (!mount) return;

    // Strict Mode guard: only init once
    if (initializedRef.current) return;
    initializedRef.current = true;

    const props = propsRef.current;

    // ── WebGL setup ──
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false,
    });

    const baseDpr = Math.min(window.devicePixelRatio || 1, 2);
    let currentDpr = baseDpr;
    renderer.setPixelRatio(currentDpr);
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    mount.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
    );

    const hexToRGB = (hex: string) => {
      let c = hex.trim();
      if (c[0] === '#') c = c.slice(1);
      if (c.length === 3) c = c.split('').map((x) => x + x).join('');
      const n = parseInt(c, 16) || 0xffffff;
      return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
    };

    const { r, g, b } = hexToRGB(props.color);

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(1, 1, 1) },
      iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
      uWispDensity: { value: props.wispDensity },
      uTiltScale: { value: 0.01 },
      uFlowTime: { value: 0 },
      uFogTime: { value: 0 },
      uBeamXFrac: { value: props.horizontalBeamOffset },
      uBeamYFrac: { value: props.verticalBeamOffset },
      uFlowSpeed: { value: props.flowSpeed },
      uVLenFactor: { value: props.verticalSizing },
      uHLenFactor: { value: props.horizontalSizing },
      uFogIntensity: { value: props.fogIntensity },
      uFogScale: { value: props.fogScale },
      uWSpeed: { value: props.wispSpeed },
      uWIntensity: { value: props.wispIntensity },
      uFlowStrength: { value: props.flowStrength },
      uDecay: { value: props.decay },
      uFalloffStart: { value: props.falloffStart },
      uFogFallSpeed: { value: props.fogFallSpeed },
      uColor: { value: new THREE.Vector3(r, g, b) },
      uFade: { value: 0 },
    };

    const material = new THREE.RawShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    // ── State ──
    const clock = new THREE.Clock();
    let prevTime = 0;
    let fade = 0;
    let inView = true;
    let paused = false;
    let contextLost = false;
    let lastW = 0;
    let lastH = 0;
    let rect: DOMRect | null = null;
    let frameCount = 0;

    // Adaptive DPR — conservative to prevent flicker
    let fpsSamples: number[] = [];
    let lastFpsCheck = performance.now();
    let emaDt = 16.7;
    let lastDprChange = 0;
    const DPR_CHECK_INTERVAL = 1500; // ms between FPS checks
    const DPR_CHANGE_COOLDOWN = 3000; // ms between DPR changes
    const DPR_FPS_LOW = 45; // only downscale on significant drops
    const DPR_FPS_HIGH = 58;

    const mouseTarget = new THREE.Vector2(0, 0);
    const mouseSmooth = new THREE.Vector2(0, 0);

    // ── Resize — throttled with deadzone ──
    const setSizeNow = () => {
      if (contextLost) return;
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      // 2px deadzone to prevent sub-pixel resize loops
      if (Math.abs(w - lastW) < 2 && Math.abs(h - lastH) < 2) return;
      lastW = w;
      lastH = h;
      renderer.setPixelRatio(currentDpr);
      renderer.setSize(w, h, false);
      uniforms.iResolution.value.set(w * currentDpr, h * currentDpr, currentDpr);
      rect = canvas.getBoundingClientRect();
      debugRef.current.resolution = `${Math.round(w * currentDpr)}x${Math.round(h * currentDpr)}`;
    };

    // Throttle resize to 100ms (not RAF which can conflict with render loop)
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setSizeNow, 100);
    });
    setSizeNow();
    ro.observe(mount);

    // ── Visibility ──
    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
      },
      { root: null, threshold: 0 },
    );
    io.observe(mount);

    const onVis = () => {
      paused = document.hidden;
      if (!document.hidden && !contextLost) {
        // Reset clock to prevent time jumps after tab switch
        prevTime = clock.getElapsedTime();
      }
    };
    document.addEventListener('visibilitychange', onVis, { passive: true });

    // ── Mouse ──
    const onMove = (ev: PointerEvent) => {
      if (!rect) return;
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const ratio = currentDpr;
      mouseTarget.set(x * ratio, rect.height * ratio - y * ratio);
    };
    const onLeave = () => mouseTarget.set(0, 0);
    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerleave', onLeave, { passive: true });

    // ── Context loss — graceful recovery with fade-in ──
    const onCtxLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      debugRef.current.status = 'contextLost';
      updateDebugOverlay();
    };
    const onCtxRestored = () => {
      contextLost = false;
      // Re-fade-in after context restore
      fade = 0;
      uniforms.uFade.value = 0;
      lastW = 0; // force resize on next frame
      lastH = 0;
      debugRef.current.status = 'running';
    };
    canvas.addEventListener('webglcontextlost', onCtxLost, false);
    canvas.addEventListener('webglcontextrestored', onCtxRestored, false);

    // ── Render loop — single stable RAF chain ──
    let raf = 0;
    let disposed = false;

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    const animate = () => {
      if (disposed) return;
      raf = requestAnimationFrame(animate);

      // Update debug state
      const isActive = !paused && !contextLost && inView;
      debugRef.current.status = contextLost ? 'contextLost' : isActive ? 'running' : 'paused';

      if (!isActive) {
        // Update debug overlay even when paused
        if (frameCount % 30 === 0) updateDebugOverlay();
        return;
      }

      const t = clock.getElapsedTime();
      const dt = Math.max(0, Math.min(0.1, t - prevTime)); // Cap dt at 100ms to prevent time jumps
      prevTime = t;

      const dtMs = dt * 1000;
      emaDt = emaDt * 0.9 + dtMs * 0.1;
      const instFps = 1000 / Math.max(1, emaDt);
      fpsSamples.push(instFps);

      uniforms.iTime.value = t;

      const cdt = Math.min(0.033, Math.max(0.001, dt));
      uniforms.uFlowTime.value += cdt;
      uniforms.uFogTime.value += cdt;

      // Fade in smoothly (1.5s)
      if (fade < 1) {
        fade = Math.min(1, fade + cdt * 0.67);
        uniforms.uFade.value = fade;
      }

      // Mouse smoothing
      const alpha = 1 - Math.exp(-cdt / 0.001);
      mouseSmooth.lerp(mouseTarget, alpha);
      uniforms.iMouse.value.set(mouseSmooth.x, mouseSmooth.y, 0, 0);

      // Check if resize needed (handles DPR changes)
      setSizeNow();

      renderer.render(scene, camera);
      frameCount++;
      debugRef.current.frameCount = frameCount;
      debugRef.current.fps = instFps;
      debugRef.current.dpr = currentDpr;

      // Update debug overlay every 30 frames
      if (frameCount % 30 === 0) updateDebugOverlay();

      // Adaptive DPR — conservative, infrequent checks
      const now = performance.now();
      if (now - lastFpsCheck > DPR_CHECK_INTERVAL && fpsSamples.length >= 10) {
        const avgFps = fpsSamples.reduce((a, c) => a + c, 0) / fpsSamples.length;
        let next = currentDpr;
        if (avgFps < DPR_FPS_LOW) next = clamp(currentDpr * 0.85, 0.6, baseDpr);
        else if (avgFps > DPR_FPS_HIGH && currentDpr < baseDpr) next = clamp(currentDpr * 1.05, 0.6, baseDpr);
        if (Math.abs(next - currentDpr) > 0.01 && now - lastDprChange > DPR_CHANGE_COOLDOWN) {
          currentDpr = next;
          lastDprChange = now;
          lastW = 0; // force resize on next frame (will be picked up by setSizeNow above)
          lastH = 0;
        }
        fpsSamples = [];
        lastFpsCheck = now;
      }
    };

    debugRef.current.status = 'running';
    animate();

    return () => {
      disposed = true;
      initializedRef.current = false;
      cancelAnimationFrame(raf);
      if (resizeTimer) clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('webglcontextlost', onCtxLost);
      canvas.removeEventListener('webglcontextrestored', onCtxRestored);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount.contains(canvas)) mount.removeChild(canvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useFallback]); // Only re-run if fallback mode changes

  // Static gradient fallback for reduced-motion / low-tier
  if (useFallback) {
    return (
      <div
        className={`w-full h-full relative ${className || ''}`}
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 50%, ${color}18 0%, transparent 70%),
            radial-gradient(ellipse 120% 80% at 50% 40%, rgba(139,92,246,0.08) 0%, transparent 60%),
            linear-gradient(180deg, #030712 0%, #0a0f1f 50%, #030712 100%)
          `,
        }}
      />
    );
  }

  return (
    <div
      ref={mountRef}
      className={`w-full h-full relative pointer-events-none ${className || ''}`}
    >
      {/* Debug overlay — only visible with ?laserDebug=1 */}
      <div
        ref={debugOverlayRef}
        style={{
          display: 'none',
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 9999,
          padding: '4px 8px',
          background: 'rgba(0,0,0,0.85)',
          color: '#0f0',
          fontFamily: 'monospace',
          fontSize: '11px',
          borderRadius: 4,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      />
    </div>
  );
}

export const LaserFlow = memo(LaserFlowInner);
export default LaserFlow;
