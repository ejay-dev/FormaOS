"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function AnimatedSystemGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const setCanvasSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);
    
    // Grid configuration
    const gridSize = 50;
    const nodes: { x: number; y: number; vx: number; vy: number; connected: Set<number> }[] = [];
    const numNodes = 30;
    
    // Initialize nodes
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        connected: new Set(),
      });
    }
    
    let animationId: number;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      
      // Draw grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
      ctx.lineWidth = 1;
      
      for (let x = 0; x < canvas.offsetWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.offsetHeight);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.offsetHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.offsetWidth, y);
        ctx.stroke();
      }
      
      // Update and draw nodes
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;
        
        if (node.x < 0 || node.x > canvas.offsetWidth) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.offsetHeight) node.vy *= -1;
        
        // Draw connections
        node.connected.clear();
        nodes.forEach((other, j) => {
          if (i === j) return;
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            node.connected.add(j);
            const opacity = (1 - distance / 150) * 0.3;
            ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
        
        // Draw node
        ctx.fillStyle = "rgba(56, 189, 248, 0.6)";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 15);
        gradient.addColorStop(0, "rgba(56, 189, 248, 0.2)");
        gradient.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 15, 0, Math.PI * 2);
        ctx.fill();
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener("resize", setCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-40"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

export function FloatingUIPanel({ delay = 0, children, className = "" }: { delay?: number; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.21, 0.45, 0.27, 0.9] }}
      style={{ y, opacity }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function DataFlowLines() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(56, 189, 248)" stopOpacity="0" />
          <stop offset="50%" stopColor="rgb(56, 189, 248)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="rgb(56, 189, 248)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0" />
          <stop offset="50%" stopColor="rgb(139, 92, 246)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Animated horizontal lines */}
      <motion.path
        d="M -100 30 L 200 30"
        stroke="url(#lineGradient1)"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, pathOffset: 0 }}
        animate={{ pathLength: 1, pathOffset: 1 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <motion.path
        d="M -100 60 L 200 60"
        stroke="url(#lineGradient1)"
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0, pathOffset: 0 }}
        animate={{ pathLength: 1, pathOffset: 1 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 0.5 }}
      />
      
      {/* Animated vertical lines */}
      <motion.path
        d="M 30 -100 L 30 200"
        stroke="url(#lineGradient2)"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, pathOffset: 0 }}
        animate={{ pathLength: 1, pathOffset: 1 }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
      />
      <motion.path
        d="M 60 -100 L 60 200"
        stroke="url(#lineGradient2)"
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0, pathOffset: 0 }}
        animate={{ pathLength: 1, pathOffset: 1 }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "linear", delay: 0.7 }}
      />
    </svg>
  );
}

export function ParallaxLayer({ children, speed = 0.5, className = "" }: { children: React.ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [-50 * speed, 50 * speed]);
  
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

export function PulsingNode({ x, y, size = 4, color = "rgb(56, 189, 248)", delay = 0 }: { x: string; y: string; size?: number; color?: string; delay?: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 0 ${size * 4}px ${color}`,
      }}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.6, 1, 0.6],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay,
      }}
    />
  );
}
