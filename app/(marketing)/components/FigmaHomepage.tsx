'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Play,
  Box,
  Zap,
  ShieldCheck,
  FileCheck,
  Database,
  Lock,
  Workflow,
  GitBranch,
  Layers,
  Terminal,
  Clock,
  Globe,
  Heart,
  Users,
  TrendingUp,
  GraduationCap,
  Building2,
  Shield,
  Eye,
  Key,
  Sparkles,
} from 'lucide-react';

// Motion System Imports
import { MotionProvider } from './motion/MotionContext';
import { ComplianceProvider, useCompliance } from './webgl/useComplianceState';
import WebGLNodeField from './webgl/NodeField';
import CinematicField from './motion/CinematicField';

// ============================================
// TYPES & INTERFACES
// ============================================

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

// ============================================
// ENHANCED MOTION SYSTEMS
// ============================================

// Process Panel UI for Story Section
function ProcessPanelUI({ step }: { step: string }) {
  const stepData = {
    model: {
      title: 'Workflow Designer',
      policy: { value: 'Draft', status: 'editing', color: 'text-yellow-400' },
      controls: { value: 'Pending', status: 'waiting', color: 'text-gray-400' },
      evidence: {
        value: 'Collecting',
        status: 'active',
        color: 'text-cyan-400',
      },
      status: {
        value: 'Setup Phase',
        status: 'progress',
        color: 'text-blue-400',
      },
      progress: 25,
    },
    execute: {
      title: 'Process Engine',
      policy: { value: 'Active', status: 'live', color: 'text-green-400' },
      controls: { value: 'Running', status: 'active', color: 'text-blue-400' },
      evidence: {
        value: 'Generating',
        status: 'active',
        color: 'text-cyan-400',
      },
      status: {
        value: 'Processing',
        status: 'progress',
        color: 'text-orange-400',
      },
      progress: 60,
    },
    verify: {
      title: 'Verification Hub',
      policy: { value: 'Active', status: 'live', color: 'text-green-400' },
      controls: {
        value: 'Verified',
        status: 'complete',
        color: 'text-purple-400',
      },
      evidence: {
        value: 'Complete',
        status: 'complete',
        color: 'text-green-400',
      },
      status: {
        value: 'Validating',
        status: 'progress',
        color: 'text-purple-400',
      },
      progress: 85,
    },
    prove: {
      title: 'Evidence Ledger',
      policy: { value: 'Locked', status: 'complete', color: 'text-green-400' },
      controls: {
        value: 'Verified',
        status: 'complete',
        color: 'text-green-400',
      },
      evidence: {
        value: 'Secured',
        status: 'complete',
        color: 'text-green-400',
      },
      status: { value: 'Ready', status: 'complete', color: 'text-green-400' },
      progress: 100,
    },
  }[step] || {
    title: 'Process Monitor',
    policy: { value: 'Active', status: 'live', color: 'text-green-400' },
    controls: {
      value: 'Verified',
      status: 'complete',
      color: 'text-green-400',
    },
    evidence: { value: 'Secured', status: 'complete', color: 'text-green-400' },
    status: { value: 'Ready', status: 'complete', color: 'text-green-400' },
    progress: 100,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'editing':
        return '✏️';
      case 'waiting':
        return '⏳';
      case 'active':
        return '🔄';
      case 'progress':
        return '⚡';
      case 'live':
        return '🟢';
      case 'complete':
        return '✅';
      default:
        return '📊';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="absolute inset-4 rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 to-gray-900/60 backdrop-blur-xl p-6 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.h4
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm font-semibold text-cyan-400 flex items-center gap-2"
        >
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          {stepData.title}
        </motion.h4>
        <div className="text-xs text-gray-500">
          {stepData.progress}% Complete
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <motion.div
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${stepData.progress}%` }}
            transition={{ duration: 1, delay: 0.6 }}
          />
        </div>
      </div>

      {/* Status Grid */}
      <div className="space-y-4">
        {Object.entries(stepData)
          .filter(([key]) => !['title', 'progress'].includes(key))
          .map(([key, data], index) => {
            const statusData = data as {
              value: string;
              status: string;
              color: string;
            };
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                className="flex items-center justify-between group hover:bg-gray-800/30 rounded-lg p-2 -mx-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {getStatusIcon(statusData.status)}
                  </span>
                  <span className="text-gray-300 capitalize text-sm font-medium">
                    {key}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${statusData.color}`}>
                    {statusData.value}
                  </span>
                  {statusData.status === 'active' && (
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                  )}
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="mt-6 pt-4 border-t border-gray-700/50"
      >
        <div className="text-xs text-gray-500 flex items-center justify-between">
          <span>Last Updated</span>
          <span className="font-mono">{new Date().toLocaleTimeString()}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Step-specific animated workflow visualizations
function StepVisualization({ step }: { step: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.2, 1, 1, 0.2],
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.8, 1, 1, 0.8],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 400 * dpr;
    canvas.height = 400 * dpr;
    canvas.style.width = '400px';
    canvas.style.height = '400px';
    ctx.scale(dpr, dpr);

    let time = 0;
    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, 400, 400);

      // Enhanced glow background
      const gradient = ctx.createRadialGradient(200, 200, 0, 200, 200, 200);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.1)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 400);

      switch (step) {
        case 'model':
          // Enhanced workflow design animation with data flow
          const modelNodes = [
            { x: 80, y: 150, label: 'Design' },
            { x: 200, y: 120, label: 'Validate' },
            { x: 320, y: 180, label: 'Deploy' },
            { x: 200, y: 250, label: 'Monitor' },
          ];

          // Draw data flow background
          for (let i = 0; i < 20; i++) {
            const flowX = (time * 0.5 + i * 20) % 400;
            const flowY = 200 + Math.sin((time + i * 30) * 0.01) * 30;
            ctx.fillStyle = `rgba(6, 182, 212, ${0.1 + Math.sin(time * 0.01 + i) * 0.1})`;
            ctx.beginPath();
            ctx.arc(flowX, flowY, 2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Draw workflow nodes with enhanced animations
          modelNodes.forEach((node, i) => {
            const progress = (Math.sin(time * 0.008 + i * 0.8) + 1) / 2;
            const isActive = (time * 0.01) % 4 < i + 1;

            // Node glow
            if (isActive) {
              const glowGradient = ctx.createRadialGradient(
                node.x,
                node.y,
                0,
                node.x,
                node.y,
                25,
              );
              glowGradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
              glowGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
              ctx.fillStyle = glowGradient;
              ctx.beginPath();
              ctx.arc(node.x, node.y, 25, 0, Math.PI * 2);
              ctx.fill();
            }

            // Main node
            ctx.fillStyle = isActive
              ? `rgba(6, 182, 212, ${0.8 + progress * 0.2})`
              : 'rgba(156, 163, 175, 0.4)';
            ctx.beginPath();
            ctx.arc(node.x, node.y, 12 + progress * 3, 0, Math.PI * 2);
            ctx.fill();

            // Node border
            ctx.strokeStyle = isActive
              ? 'rgba(6, 182, 212, 1)'
              : 'rgba(156, 163, 175, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 12 + progress * 3, 0, Math.PI * 2);
            ctx.stroke();

            // Connection lines with animation
            if (i < modelNodes.length - 1) {
              const nextNode = modelNodes[i + 1];
              const connectionProgress = (time * 0.02 + i) % 1;

              ctx.strokeStyle = isActive
                ? `rgba(6, 182, 212, ${0.6 + Math.sin(time * 0.01) * 0.2})`
                : 'rgba(156, 163, 175, 0.3)';
              ctx.lineWidth = isActive ? 3 : 1;
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(nextNode.x, nextNode.y);
              ctx.stroke();

              // Animated data packets
              if (isActive && connectionProgress > 0.2) {
                const packetX =
                  node.x + (nextNode.x - node.x) * connectionProgress;
                const packetY =
                  node.y + (nextNode.y - node.y) * connectionProgress;
                ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
                ctx.beginPath();
                ctx.arc(packetX, packetY, 4, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          });
          break;

        case 'execute':
          // Enhanced process execution animation with progress rings
          const executeNodes = 8;
          const executeCenterX = 200;
          const executeCenterY = 200;

          // Central processing core
          const coreProgress = (Math.sin(time * 0.01) + 1) / 2;
          const coreGradient = ctx.createRadialGradient(
            executeCenterX,
            executeCenterY,
            0,
            executeCenterX,
            executeCenterY,
            30,
          );
          coreGradient.addColorStop(
            0,
            `rgba(59, 130, 246, ${0.6 + coreProgress * 0.4})`,
          );
          coreGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
          ctx.fillStyle = coreGradient;
          ctx.beginPath();
          ctx.arc(executeCenterX, executeCenterY, 30, 0, Math.PI * 2);
          ctx.fill();

          // Progress rings
          for (let ring = 0; ring < 3; ring++) {
            const radius = 40 + ring * 25;
            const ringProgress = (time * 0.005 + ring * 0.3) % 1;

            ctx.strokeStyle = `rgba(59, 130, 246, ${0.4 - ring * 0.1})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
              executeCenterX,
              executeCenterY,
              radius,
              0,
              Math.PI * 2 * ringProgress,
            );
            ctx.stroke();
          }

          // Execution nodes with enhanced animation
          for (let i = 0; i < executeNodes; i++) {
            const angle = (i / executeNodes) * Math.PI * 2 + time * 0.003;
            const x = executeCenterX + Math.cos(angle) * 90;
            const y = executeCenterY + Math.sin(angle) * 90;
            const activePhase = (time * 0.01 + i * 0.5) % executeNodes;
            const isActive = Math.abs(activePhase - i) < 1.5;
            const intensity = isActive ? 1 : 0.2;

            // Node glow effect
            if (isActive) {
              const nodeGlow = ctx.createRadialGradient(x, y, 0, x, y, 15);
              nodeGlow.addColorStop(0, 'rgba(59, 130, 246, 0.6)');
              nodeGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');
              ctx.fillStyle = nodeGlow;
              ctx.beginPath();
              ctx.arc(x, y, 15, 0, Math.PI * 2);
              ctx.fill();
            }

            // Main execution node
            ctx.fillStyle = `rgba(59, 130, 246, ${intensity * 0.8})`;
            ctx.beginPath();
            ctx.arc(x, y, isActive ? 8 : 5, 0, Math.PI * 2);
            ctx.fill();

            // Connection to center
            if (isActive) {
              ctx.strokeStyle = `rgba(59, 130, 246, ${intensity * 0.6})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(executeCenterX, executeCenterY);
              ctx.stroke();

              // Data pulse along connection
              const pulseProgress = (time * 0.02 + i) % 1;
              const pulseX = x + (executeCenterX - x) * pulseProgress;
              const pulseY = y + (executeCenterY - y) * pulseProgress;
              ctx.fillStyle = 'rgba(59, 130, 246, 1)';
              ctx.beginPath();
              ctx.arc(pulseX, pulseY, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          break;

        case 'verify':
          // Enhanced verification clustering with validation waves
          const verifyNodes = 8;
          const verifyCenterX = 200;
          const verifyCenterY = 200;

          // Verification scanning waves
          for (let wave = 0; wave < 3; wave++) {
            const waveRadius = ((time * 0.8 + wave * 30) % 120) + 20;
            const waveOpacity = Math.max(0, ((120 - waveRadius) / 120) * 0.3);

            ctx.strokeStyle = `rgba(168, 85, 247, ${waveOpacity})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(verifyCenterX, verifyCenterY, waveRadius, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Verification nodes with clustering behavior
          for (let i = 0; i < verifyNodes; i++) {
            const baseAngle = (i / verifyNodes) * Math.PI * 2;
            const clusterOffset = Math.sin(time * 0.01 + i) * 20;
            const x =
              verifyCenterX + Math.cos(baseAngle) * (70 + clusterOffset);
            const y =
              verifyCenterY + Math.sin(baseAngle) * (70 + clusterOffset);

            const verificationProgress = (time * 0.03 - i * 0.3) % 1;
            const isVerified = verificationProgress > 0.5;
            const verificationStrength = isVerified
              ? Math.sin((time * 0.02 + i) * Math.PI)
              : 0;

            // Verification glow
            if (isVerified && verificationStrength > 0) {
              const glowIntensity = verificationStrength * 0.4;
              const verifyGlow = ctx.createRadialGradient(x, y, 0, x, y, 25);
              verifyGlow.addColorStop(
                0,
                `rgba(168, 85, 247, ${glowIntensity})`,
              );
              verifyGlow.addColorStop(1, 'rgba(168, 85, 247, 0)');
              ctx.fillStyle = verifyGlow;
              ctx.beginPath();
              ctx.arc(x, y, 25, 0, Math.PI * 2);
              ctx.fill();
            }

            // Main verification node
            ctx.fillStyle = isVerified
              ? `rgba(168, 85, 247, ${0.7 + verificationStrength * 0.3})`
              : 'rgba(156, 163, 175, 0.4)';
            ctx.beginPath();
            ctx.arc(x, y, isVerified ? 10 : 6, 0, Math.PI * 2);
            ctx.fill();

            // Verification checkmark
            if (isVerified && verificationStrength > 0.3) {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.lineWidth = 2;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(x - 4, y);
              ctx.lineTo(x - 1, y + 3);
              ctx.lineTo(x + 4, y - 2);
              ctx.stroke();
            }

            // Cross-verification connections
            for (let j = i + 1; j < verifyNodes; j++) {
              if (Math.abs(i - j) <= 2) {
                const otherAngle = (j / verifyNodes) * Math.PI * 2;
                const otherX =
                  verifyCenterX +
                  Math.cos(otherAngle) * (70 + Math.sin(time * 0.01 + j) * 20);
                const otherY =
                  verifyCenterY +
                  Math.sin(otherAngle) * (70 + Math.sin(time * 0.01 + j) * 20);

                const connectionStrength = Math.min(
                  verificationProgress,
                  (time * 0.03 - j * 0.3) % 1,
                );
                if (connectionStrength > 0.3) {
                  ctx.strokeStyle = `rgba(168, 85, 247, ${connectionStrength * 0.3})`;
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  ctx.moveTo(x, y);
                  ctx.lineTo(otherX, otherY);
                  ctx.stroke();
                }
              }
            }
          }
          break;

        case 'prove':
          // Enhanced evidence chain with blockchain-style validation
          const evidenceBlocks = 6;
          const blockWidth = 50;
          const blockHeight = 35;
          const startX = 50;
          const chainY = 200;

          // Background ledger grid
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)';
          ctx.lineWidth = 1;
          for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(30, 150 + i * 15);
            ctx.lineTo(370, 150 + i * 15);
            ctx.stroke();
          }

          // Evidence chain blocks
          for (let i = 0; i < evidenceBlocks; i++) {
            const x = startX + i * (blockWidth + 10);
            const lockProgress = (time * 0.02 - i * 0.2) % 1;
            const isLocked = lockProgress > 0.6;
            const lockStrength = isLocked
              ? Math.min(1, (lockProgress - 0.6) * 2.5)
              : 0;

            // Block shadow for depth
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(
              x - blockWidth / 2 + 2,
              chainY - blockHeight / 2 + 2,
              blockWidth,
              blockHeight,
            );

            // Main evidence block
            const blockGradient = ctx.createLinearGradient(
              x - blockWidth / 2,
              chainY - blockHeight / 2,
              x + blockWidth / 2,
              chainY + blockHeight / 2,
            );
            if (isLocked) {
              blockGradient.addColorStop(
                0,
                `rgba(16, 185, 129, ${0.7 + lockStrength * 0.3})`,
              );
              blockGradient.addColorStop(
                1,
                `rgba(5, 150, 105, ${0.5 + lockStrength * 0.2})`,
              );
            } else {
              blockGradient.addColorStop(0, 'rgba(156, 163, 175, 0.4)');
              blockGradient.addColorStop(1, 'rgba(107, 114, 128, 0.3)');
            }
            ctx.fillStyle = blockGradient;
            ctx.fillRect(
              x - blockWidth / 2,
              chainY - blockHeight / 2,
              blockWidth,
              blockHeight,
            );

            // Block border
            ctx.strokeStyle = isLocked
              ? 'rgba(16, 185, 129, 1)'
              : 'rgba(156, 163, 175, 0.6)';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              x - blockWidth / 2,
              chainY - blockHeight / 2,
              blockWidth,
              blockHeight,
            );

            // Hash visualization inside block
            if (isLocked) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
              ctx.font = '8px monospace';
              ctx.textAlign = 'center';
              ctx.fillText(`#${i.toString(16).toUpperCase()}`, x, chainY - 5);

              // Mini hash bars
              for (let h = 0; h < 3; h++) {
                const barWidth = Math.random() * 15 + 5;
                ctx.fillRect(x - barWidth / 2, chainY + 2 + h * 3, barWidth, 2);
              }
            }

            // Enhanced lock icon
            if (isLocked) {
              const lockY = chainY - blockHeight / 2 - 12;

              // Lock glow
              const lockGlow = ctx.createRadialGradient(
                x,
                lockY,
                0,
                x,
                lockY,
                8,
              );
              lockGlow.addColorStop(0, 'rgba(16, 185, 129, 0.6)');
              lockGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
              ctx.fillStyle = lockGlow;
              ctx.beginPath();
              ctx.arc(x, lockY, 8, 0, Math.PI * 2);
              ctx.fill();

              // Lock body
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.fillRect(x - 3, lockY - 1, 6, 4);

              // Lock shackle
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(x, lockY - 2, 2.5, Math.PI, 0);
              ctx.stroke();
            }

            // Chain connections with hash validation
            if (i < evidenceBlocks - 1) {
              const nextX = startX + (i + 1) * (blockWidth + 10);
              const connectionLocked =
                isLocked && (time * 0.02 - (i + 1) * 0.2) % 1 > 0.4;

              // Chain link background
              ctx.strokeStyle = connectionLocked
                ? 'rgba(16, 185, 129, 0.8)'
                : 'rgba(156, 163, 175, 0.4)';
              ctx.lineWidth = 6;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(x + blockWidth / 2, chainY);
              ctx.lineTo(nextX - blockWidth / 2, chainY);
              ctx.stroke();

              // Chain link highlight
              ctx.strokeStyle = connectionLocked
                ? 'rgba(255, 255, 255, 0.3)'
                : 'rgba(255, 255, 255, 0.1)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(x + blockWidth / 2, chainY - 1);
              ctx.lineTo(nextX - blockWidth / 2, chainY - 1);
              ctx.stroke();

              // Validation pulse
              if (connectionLocked) {
                const pulseProgress = (time * 0.03 + i) % 1;
                const pulseX =
                  x +
                  blockWidth / 2 +
                  (nextX - blockWidth / 2 - (x + blockWidth / 2)) *
                    pulseProgress;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(pulseX, chainY, 3, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          // Cryptographic hash visualization
          ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('Immutable Evidence Chain', 200, 280);
          break;
      }

      time += 1;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [step]);

  return (
    <motion.div
      ref={containerRef}
      style={{ opacity, scale }}
      className="absolute inset-0"
    >
      <canvas ref={canvasRef} className="absolute inset-0 opacity-90" />

      {/* Enhanced overlay effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c]/30 via-transparent to-[#0a0f1c]/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent" />

      {/* Interactive glow on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-3xl opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

// Industry-specific micro-visuals
function IndustryMicroVisual({
  type,
  active,
}: {
  type: string;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 120;

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, 200, 120);

      if (!active) {
        time += 0.5;
        requestAnimationFrame(animate);
        return;
      }

      switch (type) {
        case 'healthcare':
          // Heartbeat line
          const heartbeatPoints = [
            { x: 20, y: 60 },
            { x: 40, y: 60 },
            { x: 45, y: 40 },
            { x: 50, y: 80 },
            { x: 55, y: 60 },
            { x: 180, y: 60 },
          ];
          const progress = (time * 0.02) % 1;
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < heartbeatPoints.length * progress; i++) {
            const point =
              heartbeatPoints[Math.min(i, heartbeatPoints.length - 1)];
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
          }
          ctx.stroke();
          break;

        case 'finance':
          // Data spikes
          for (let i = 0; i < 10; i++) {
            const x = 20 + i * 16;
            const height = 20 + Math.sin(time * 0.01 + i) * 15;
            ctx.fillStyle = `rgba(34, 197, 94, ${0.3 + Math.sin(time * 0.01 + i) * 0.3})`;
            ctx.fillRect(x, 60 - height / 2, 12, height);
          }
          break;

        case 'government':
          // Node grid
          for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 2; j++) {
              const x = 40 + i * 30;
              const y = 40 + j * 40;
              const connected = Math.sin(time * 0.01 + i + j) > 0;
              ctx.fillStyle = connected
                ? 'rgba(59, 130, 246, 0.8)'
                : 'rgba(156, 163, 175, 0.4)';
              ctx.beginPath();
              ctx.arc(x, y, connected ? 4 : 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          break;

        case 'manufacturing':
          // Process flow
          const gearAngle = time * 0.02;
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
          ctx.lineWidth = 2;
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4 + gearAngle;
            const x = 100 + Math.cos(angle) * 30;
            const y = 60 + Math.sin(angle) * 30;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;

        default:
          // Generic data flow
          for (let i = 0; i < 5; i++) {
            const x = 20 + i * 40;
            const y = 60 + Math.sin(time * 0.01 + i) * 10;
            ctx.fillStyle = `rgba(6, 182, 212, ${0.3 + Math.sin(time * 0.01 + i) * 0.3})`;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
      }

      time += 1;
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      // Cleanup will happen when component unmounts
    };
  }, [type, active]);

  return <canvas ref={canvasRef} className="absolute inset-0 opacity-30" />;
}

// ============================================
// HERO ENHANCEMENT COMPONENTS
// ============================================

// Legacy MetricsCard - kept for potential reuse
function _MetricsCard({
  metric,
  delay = 0,
}: {
  metric: { label: string; value: string; trend: string; icon: any };
  delay?: number;
}) {
  const Icon = metric.icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
      <div className="relative bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 group-hover:border-cyan-500/20 rounded-2xl p-6 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <Icon className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
            {metric.trend}
          </span>
        </div>
        <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
        <div className="text-sm text-gray-400">{metric.label}</div>
      </div>
    </motion.div>
  );
}

// Legacy ProcessFlow - kept for potential reuse
function _ProcessFlow() {
  const steps = ['Structure', 'Operationalize', 'Validate', 'Defend'];

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, delay: 0.8 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-purple-500/10 rounded-3xl blur-2xl" />
      <div className="relative bg-gradient-to-br from-gray-900/40 to-gray-950/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
        <h3 className="text-lg font-semibold text-white mb-6 text-center">
          Process Flow
        </h3>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1 + index * 0.15 }}
              className="flex items-center gap-4 group cursor-pointer"
            >
              <motion.div
                whileHover={{ scale: 1.2, rotate: 10 }}
                className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm ${
                  index === 0
                    ? 'from-cyan-500 to-blue-500'
                    : index === 1
                      ? 'from-blue-500 to-purple-500'
                      : index === 2
                        ? 'from-purple-500 to-pink-500'
                        : 'from-pink-500 to-cyan-500'
                }`}
              >
                {index + 1}
              </motion.div>
              <div className="flex-1">
                <div className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                  {step}
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.8, delay: 1.2 + index * 0.2 }}
                    className={`h-full rounded-full bg-gradient-to-r ${
                      index === 0
                        ? 'from-cyan-500 to-blue-500'
                        : index === 1
                          ? 'from-blue-500 to-purple-500'
                          : index === 2
                            ? 'from-purple-500 to-pink-500'
                            : 'from-pink-500 to-cyan-500'
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// NODE NETWORK COMPONENT
// ============================================

// Legacy NodeNetwork - kept for potential reuse
function _NodeNetwork({
  variant = 'default',
  intensity = 1,
}: {
  variant?: 'default' | 'connecting' | 'verified' | 'complete';
  intensity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Initialize nodes
    const nodeCount =
      variant === 'complete' ? 30 : variant === 'verified' ? 25 : 20;
    nodesRef.current = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 3 + 2,
    }));

    const getColor = () => {
      switch (variant) {
        case 'connecting':
          return {
            primary: 'rgba(59, 130, 246, ',
            secondary: 'rgba(147, 51, 234, ',
          };
        case 'verified':
          return {
            primary: 'rgba(168, 85, 247, ',
            secondary: 'rgba(236, 72, 153, ',
          };
        case 'complete':
          return {
            primary: 'rgba(236, 72, 153, ',
            secondary: 'rgba(6, 182, 212, ',
          };
        default:
          return {
            primary: 'rgba(6, 182, 212, ',
            secondary: 'rgba(59, 130, 246, ',
          };
      }
    };

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const colors = getColor();

      // Update and draw nodes
      nodesRef.current.forEach((node, i) => {
        // Move nodes
        node.x += node.vx * intensity;
        node.y += node.vy * intensity;

        // Bounce off edges
        if (node.x < 0 || node.x > rect.width) node.vx *= -1;
        if (node.y < 0 || node.y > rect.height) node.vy *= -1;

        // Mouse interaction
        if (isHovering) {
          const dx = mouseRef.current.x - node.x;
          const dy = mouseRef.current.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            node.x -= dx * 0.01;
            node.y -= dy * 0.01;
          }
        }

        // Draw connections
        nodesRef.current.slice(i + 1).forEach((otherNode) => {
          const dx = otherNode.x - node.x;
          const dy = otherNode.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            const opacity = (1 - distance / 150) * 0.3 * intensity;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.strokeStyle = `${colors.primary}${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.radius * 2,
        );
        gradient.addColorStop(0, `${colors.primary}${0.8 * intensity})`);
        gradient.addColorStop(1, `${colors.secondary}${0.2 * intensity})`);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Glow effect
        ctx.shadowBlur = 15 * intensity;
        ctx.shadowColor = `${colors.primary}0.6)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [variant, intensity, isHovering]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    />
  );
}

// ============================================
// HERO COMPONENT
// ============================================

function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const { state } = useCompliance();

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] pt-24"
    >
      {/* Premium Background Effects - Cinematic Gradient Layers */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gradient orb - top left */}
        <motion.div
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Secondary gradient orb - bottom right */}
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-purple-500/15 via-pink-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        {/* Tertiary accent - center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-cyan-500/5 to-transparent rounded-full" />
      </div>

      {/* WebGL 3D Node Field */}
      <div className="absolute inset-0 z-0">
        <WebGLNodeField state={state} />
      </div>

      {/* Cinematic Particle Field */}
      <div className="absolute inset-0 z-1">
        <CinematicField />
      </div>

      {/* Floating Metrics - Left Side */}
      <div className="absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 z-20">
        <FloatingMetricCard
          value="99.7%"
          label="Compliance Rate"
          trend="+12%"
          icon={ShieldCheck}
          delay={0.8}
          direction="left"
        />
        <FloatingMetricCard
          value="2.4M"
          label="Evidence Records"
          trend="+45%"
          icon={Database}
          delay={1.0}
          direction="left"
        />
      </div>

      {/* Floating Metrics - Right Side */}
      <div className="absolute right-8 lg:right-16 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 z-20">
        <FloatingMetricCard
          value="-73%"
          label="Audit Time"
          trend="Reduced"
          icon={Clock}
          delay={1.2}
          direction="right"
        />
        <FloatingMetricCard
          value="24/7"
          label="Monitoring"
          trend="Always On"
          icon={Eye}
          delay={1.4}
          direction="right"
        />
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center">
          <motion.div style={{ opacity, scale, y }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-8 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium tracking-wide">
                Enterprise Compliance OS
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              Operational Compliance,
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Built for Real Organizations
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-4 max-w-2xl mx-auto text-center leading-relaxed"
            >
              The operating system for governance, controls, evidence, and audit
              defense. Not a document repository—a system that enforces
              accountability.
            </motion.p>

            {/* OS Authority Statement - Enhanced */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.65 }}
              className="mb-10 max-w-2xl mx-auto text-center"
            >
              <p className="text-sm text-gray-500 mb-3">
                Structure → Operationalize → Validate → Defend
              </p>
              {/* OS Capability Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Workflow Orchestration
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Control Ownership
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Evidence Chains
                </span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <motion.a
                href="/auth"
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)',
                }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg flex items-center gap-3 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <motion.a
                href="/contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold text-lg flex items-center gap-3 hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-all"
              >
                <Play className="w-5 h-5" />
                <span>Request Demo</span>
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Proof Strip - Mobile Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="xl:hidden grid grid-cols-3 gap-4 w-full max-w-lg"
          >
            <ProofMetric value="99.7%" label="Compliance" />
            <ProofMetric value="2.4M" label="Records" />
            <ProofMetric value="-73%" label="Audit Time" />
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-gray-600/50 flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// Floating Metric Card Component
function FloatingMetricCard({
  value,
  label,
  trend,
  icon: Icon,
  delay,
  direction,
}: {
  value: string;
  label: string;
  trend: string;
  icon: LucideIcon;
  delay: number;
  direction: 'left' | 'right';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction === 'left' ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="relative p-5 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all shadow-2xl shadow-black/30"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
          <Icon className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-sm text-gray-400">{label}</div>
        </div>
      </div>
      <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-400 font-medium">
        {trend}
      </div>
    </motion.div>
  );
}

// Proof Metric for Mobile
function ProofMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-4 rounded-xl bg-white/3 backdrop-blur-sm border border-white/5">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
// ============================================
// VALUE PROPOSITION SECTION
// ============================================

function ValueProposition() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-[#0a0f1c] to-[#0d1421] overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* OS Authority Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Operating System Architecture
          </motion.div>

          <motion.p
            className="text-lg sm:text-xl text-gray-400 mb-6 leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            FormaOS is the operating system that runs your compliance program.
            Not a repository. Not a checklist. A live system that enforces
            governance, tracks accountability, and produces defensible evidence.
          </motion.p>

          {/* OS Capability Statement */}
          <motion.p
            className="text-sm text-gray-500 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            Real-time compliance state. Immutable evidence chains.
            System-enforced accountability—not spreadsheet-level tracking.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            <motion.div
              initial={{ opacity: 0, x: -30, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 backdrop-blur-xl border border-white/5 hover:border-red-500/20 transition-all duration-500 group"
            >
              {/* Red accent for "old way" */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500/60" />
                Other tools store documents.
              </h3>
              <p className="text-gray-500 mb-4">
                Static repositories. Manual reminders. Evidence scattered across
                folders. Hope the auditor doesn't ask the hard questions.
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500/50" />
                  No control enforcement
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500/50" />
                  Point-in-time snapshots
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500/50" />
                  Manual evidence collection
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-500 group shadow-lg shadow-cyan-500/5"
            >
              {/* Cyan accent for "FormaOS way" */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                FormaOS runs your program.
              </h3>
              <p className="text-gray-500 mb-4">
                A live operating system. Controls are enforced, not just
                recorded. Evidence is automatic. Accountability is system-level.
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  Workflow orchestration built-in
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  Real-time compliance posture
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  Immutable audit trail
                </li>
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// SCROLL STORY COMPONENT
// ============================================

const steps = [
  {
    id: 'model',
    title: 'Structure',
    description:
      'Define your governance architecture. Map obligations to controls, controls to owners, and owners to evidence requirements. The OS knows who is accountable for what.',
    icon: Box,
    variant: 'default' as const,
    color: 'from-cyan-400 to-blue-500',
    features: [
      'Governance hierarchy as code',
      'Framework-to-control mapping',
      'Ownership and accountability chains',
    ],
  },
  {
    id: 'execute',
    title: 'Operationalize',
    description:
      'Controls become enforced workflows. Tasks are assigned, deadlines are tracked, escalations are automatic. The OS ensures execution—not just intention.',
    icon: Zap,
    variant: 'connecting' as const,
    color: 'from-blue-500 to-purple-500',
    features: [
      'Automated control enforcement',
      'Deadline and escalation rules',
      'Immutable execution logs',
    ],
  },
  {
    id: 'verify',
    title: 'Validate',
    description:
      'The OS continuously verifies control status. Gaps are flagged instantly. Compliance posture is always current, never a point-in-time snapshot.',
    icon: ShieldCheck,
    variant: 'verified' as const,
    color: 'from-purple-500 to-pink-500',
    features: [
      'Real-time control verification',
      'Continuous posture monitoring',
      'Instant gap detection',
    ],
  },
  {
    id: 'prove',
    title: 'Defend',
    description:
      'When auditors arrive, the evidence is already assembled. Chain of custody, timestamps, attestations—all exportable, all defensible, all undeniable.',
    icon: FileCheck,
    variant: 'complete' as const,
    color: 'from-pink-500 to-cyan-500',
    features: [
      'Pre-assembled evidence packages',
      'Immutable audit trail',
      'One-click regulatory export',
    ],
  },
];

// Legacy StoryStep - kept for potential reuse
function _StoryStep({
  step,
  index,
  totalSteps,
}: {
  step: (typeof steps)[0];
  index: number;
  totalSteps: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { setState } = useCompliance();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start center', 'end center'],
  });

  // Update compliance state based on scroll position
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      if (latest > 0.3 && latest < 0.7) {
        setState(step.id as any);
      }
    });
    return () => unsubscribe();
  }, [step.id, setState, scrollYProgress]);

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const scale = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0.8, 1, 1, 0.8],
  );
  const x = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [index % 2 === 0 ? -50 : 50, 0, 0, index % 2 === 0 ? 50 : -50],
  );

  const Icon = step.icon;

  return (
    <div ref={ref} className="relative" style={{ position: 'relative' }}>
      <motion.div
        style={{ opacity, scale }}
        className="grid lg:grid-cols-2 gap-12 items-center min-h-screen py-20"
      >
        {/* Content */}
        <motion.div
          style={{ x: index % 2 === 0 ? x : 0 }}
          className={`space-y-6 ${index % 2 === 1 ? 'lg:order-2' : ''}`}
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-white/10">
            <span className="text-sm text-gray-400">
              Step {index + 1} of {totalSteps}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center`}
            >
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold">{step.title}</h2>
          </div>

          <p className="text-xl text-gray-400 leading-relaxed">
            {step.description}
          </p>

          {/* Features list */}
          <div className="space-y-3">
            {step.features.map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${step.color}`}
                />
                <span className="text-gray-400">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Enhanced Visual with Animated Workflow Diagram */}
        <motion.div
          style={{ x: index % 2 === 1 ? x : 0 }}
          className={`relative h-[400px] rounded-3xl bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-white/5 overflow-hidden ${
            index % 2 === 1 ? 'lg:order-1' : ''
          }`}
        >
          {/* Animated Step-Specific Diagrams */}
          <StepVisualization step={step.id} />

          {/* Process Panel UI Overlay */}
          <ProcessPanelUI step={step.id} />

          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c]/20 via-transparent to-transparent" />
        </motion.div>
      </motion.div>
    </div>
  );
}

function CompactStoryStep({
  step,
  index,
  totalSteps: _totalSteps,
}: {
  step: (typeof steps)[0];
  index: number;
  totalSteps: number;
}) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, y: -8 }}
      className="group relative pt-4 mt-4 p-8 rounded-3xl bg-gradient-to-br from-gray-900/50 to-gray-950/50 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-500 shadow-xl shadow-black/20"
    >
      {/* Animated background gradient on hover */}
      <motion.div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
      />

      {/* Glowing edge accent */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      </div>

      {/* Step number indicator with glow */}
      <div className="absolute top-2 right-3 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-cyan-500/30 z-10">
        {index + 1}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <motion.div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold group-hover:text-cyan-400 transition-colors duration-300">
          {step.title}
        </h3>
      </div>

      <p className="text-gray-400 leading-relaxed mb-6">{step.description}</p>

      {/* Features list with staggered animation */}
      <div className="space-y-3">
        {step.features.map((feature, featureIdx) => (
          <motion.div
            key={feature}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + featureIdx * 0.08 }}
            className="flex items-center gap-3 group/feature"
          >
            <motion.div
              className={`w-2 h-2 rounded-full bg-gradient-to-r ${step.color}`}
              whileHover={{ scale: 1.5 }}
            />
            <span className="text-sm text-gray-500 group-hover/feature:text-gray-300 transition-colors">
              {feature}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  // scrollYProgress available for future scroll animations
  useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  return (
    <section
      ref={containerRef}
      className="relative py-32 bg-gradient-to-b from-[#0d1421] via-[#0a0f1c] to-[#0a0f1c] overflow-hidden"
      style={{ position: 'relative' }}
    >
      {/* Ambient background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-1/4 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Header with enhanced styling */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          {/* Label badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            How It Works
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            The Compliance
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
              {' '}
              Lifecycle
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            From framework mapping to audit defense - a complete workflow that
            transforms obligations into enforceable controls with clear
            ownership.
          </p>
        </motion.div>

        {/* Steps in 2x2 Grid Layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <CompactStoryStep
              key={step.id}
              step={step}
              index={index}
              totalSteps={steps.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// CAPABILITIES GRID COMPONENT
// ============================================

const capabilities = [
  {
    icon: Workflow,
    title: 'Control Intelligence',
    description:
      'Map obligations to controls, policies, and evidence with clear owners and review cadence.',
    color: 'from-cyan-400 to-blue-500',
  },
  {
    icon: Database,
    title: 'Evidence Management',
    description:
      'Secure chain of custody for all compliance evidence with immutable audit trails.',
    color: 'from-blue-500 to-purple-500',
  },
  {
    icon: Lock,
    title: 'Operational Governance',
    description:
      'Turn requirements into tasks with due dates, escalation paths, and audit visibility.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: GitBranch,
    title: 'Framework Alignment',
    description:
      'Map your organization to multiple compliance frameworks with consistent controls.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Layers,
    title: 'Risk Assessment',
    description:
      'Continuous risk monitoring with heatmaps and automated control effectiveness scoring.',
    color: 'from-rose-500 to-orange-500',
  },
  {
    icon: Terminal,
    title: 'Audit Readiness',
    description:
      'One-click evidence packages and automated regulatory reporting.',
    color: 'from-orange-500 to-yellow-500',
  },
  {
    icon: Clock,
    title: 'Task Automation',
    description:
      'Automated task creation, reminders, and escalation workflows.',
    color: 'from-yellow-500 to-green-500',
  },
  {
    icon: Globe,
    title: 'Multi-Site Operations',
    description:
      'Manage compliance across multiple sites and jurisdictions from one platform.',
    color: 'from-green-500 to-cyan-500',
  },
];

function CapabilitiesGrid() {
  return (
    <section className="relative py-32 bg-gradient-to-b from-[#0a0f1c] to-[#0d1421] overflow-hidden">
      {/* Background accent with animation */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          {/* Label badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            Platform Capabilities
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Complete Compliance
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              {' '}
              Operating System
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Every capability is interconnected. Obligations flow to controls,
            controls trigger tasks, tasks produce evidence. One system. One
            truth.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <motion.div
                key={capability.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group relative p-8 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer backdrop-blur-sm"
              >
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${capability.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                />

                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${capability.color} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-semibold mb-3 group-hover:text-cyan-400 transition-colors">
                  {capability.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {capability.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================
// SECURITY COMPONENT - Enhanced for Evidence Protection
// ============================================

const industries = [
  {
    icon: Heart,
    title: 'Healthcare',
    description:
      'Clinical workflows, patient safety, and regulatory compliance.',
    features: [
      'HIPAA Compliance',
      'Clinical Audit Trails',
      'Patient Safety Monitoring',
    ],
    color: 'from-rose-400 to-pink-600',
    stats: { label: 'Reduction in Audit Time', value: '73%' },
  },
  {
    icon: Users,
    title: 'NDIS',
    description:
      'Evidence-based care, participant safety, and quality assurance.',
    features: [
      'NDIS Quality Standards',
      'Incident Management',
      'Participant Outcomes',
    ],
    color: 'from-cyan-400 to-blue-600',
    stats: { label: 'Compliance Score', value: '98%' },
  },
  {
    icon: TrendingUp,
    title: 'Finance',
    description:
      'Transaction verification, fraud detection, and regulatory reporting.',
    features: [
      'SOC 2 Ready',
      'Transaction Integrity',
      'Real-time Fraud Detection',
    ],
    color: 'from-green-400 to-emerald-600',
    stats: { label: 'Faster Reporting', value: '5x' },
  },
  {
    icon: GraduationCap,
    title: 'Education',
    description: 'Student outcomes, accreditation, and program effectiveness.',
    features: [
      'Learning Analytics',
      'Accreditation Evidence',
      'Outcome Tracking',
    ],
    color: 'from-purple-400 to-violet-600',
    stats: { label: 'Accreditation Success', value: '100%' },
  },
  {
    icon: Building2,
    title: 'Government',
    description: 'Public accountability, transparency, and service delivery.',
    features: [
      'Freedom of Information',
      'Service Level Tracking',
      'Public Reporting',
    ],
    color: 'from-amber-400 to-orange-600',
    stats: { label: 'Transparency Score', value: 'A+' },
  },
];

function Industries() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // scrollYProgress available for future scroll animations
  useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Detect mobile for performance optimization
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mouse tracking for parallax effects - disabled on mobile
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setMousePosition({ x, y });
  };

  // Animated background particles - reduced on mobile
  const backgroundParticles = Array.from(
    { length: isMobile ? 6 : 20 },
    (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
    }),
  );

  return (
    <section
      ref={containerRef}
      className="relative py-16 sm:py-24 lg:py-32 bg-[#0a0f1c] overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => !isMobile && setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setMousePosition({ x: 0, y: 0 });
      }}
    >
      {/* Dynamic Background Elements - simplified on mobile */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs - static on mobile for performance */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[250px] sm:w-[400px] lg:w-[500px] h-[250px] sm:h-[400px] lg:h-[500px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl sm:blur-3xl will-change-transform"
          animate={
            isMobile
              ? {}
              : {
                  x: mousePosition.x * 30,
                  y: mousePosition.y * 20,
                  scale: isHovering ? 1.2 : 1,
                }
          }
          transition={{ type: 'spring', stiffness: 50, damping: 30 }}
          style={{ transform: 'translateZ(0)' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[200px] sm:w-[300px] lg:w-[400px] h-[200px] sm:h-[300px] lg:h-[400px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-2xl sm:blur-3xl will-change-transform"
          animate={
            isMobile
              ? {}
              : {
                  x: mousePosition.x * -25,
                  y: mousePosition.y * -15,
                  scale: isHovering ? 1.1 : 1,
                }
          }
          transition={{ type: 'spring', stiffness: 40, damping: 35 }}
          style={{ transform: 'translateZ(0)' }}
        />

        {/* Floating particles - simplified on mobile */}
        {!isMobile &&
          backgroundParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              animate={{
                x: [0, mousePosition.x * 10, 0],
                y: [0, mousePosition.y * 8, 0],
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}

        {/* Data connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient
              id="connectionGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.1)" />
              <stop offset="50%" stopColor="rgba(59, 130, 246, 0.3)" />
              <stop offset="100%" stopColor="rgba(168, 85, 247, 0.1)" />
            </linearGradient>
          </defs>
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.line
              key={i}
              x1={`${10 + i * 15}%`}
              y1="20%"
              x2={`${90 - i * 10}%`}
              y2="80%"
              stroke="url(#connectionGradient)"
              strokeWidth="1"
              strokeDasharray="5,5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: isHovering ? 1 : 0.3,
                opacity: isHovering ? 0.6 : 0.2,
                strokeDashoffset: [0, -10],
              }}
              transition={{
                pathLength: { duration: 1, ease: 'easeInOut' },
                opacity: { duration: 0.5 },
                strokeDashoffset: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                },
              }}
            />
          ))}
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          {/* Label badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6"
          >
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
            Industry Solutions
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            Trusted Across
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent">
              {' '}
              Industries
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
            Purpose-built solutions for regulated sectors that demand the
            highest standards of evidence and compliance.
          </p>
        </motion.div>

        {/* Mobile: 2-column grid, Desktop: 5-column grid */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12">
          {industries.map((industry, index) => {
            const Icon = industry.icon;
            const isActive = activeIndex === index;
            const cardOffset = isMobile
              ? { x: 0, y: 0 }
              : {
                  x: mousePosition.x * (5 - Math.abs(index - 2)) * 2,
                  y: mousePosition.y * (5 - Math.abs(index - 2)) * 1.5,
                };

            return (
              <motion.div
                key={industry.title}
                className="relative group perspective-1000"
                initial={{ opacity: 0, y: 20, rotateX: 15 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.15,
                  duration: 0.8,
                  type: 'spring',
                  stiffness: 100,
                  damping: 25,
                }}
                animate={{
                  x: cardOffset.x,
                  y: cardOffset.y,
                }}
                style={{
                  transformStyle: isMobile ? 'flat' : 'preserve-3d',
                }}
              >
                <motion.button
                  onClick={() => setActiveIndex(index)}
                  whileHover={
                    isMobile
                      ? { scale: 1.02 }
                      : {
                          scale: 1.08,
                          y: -12,
                          rotateY: mousePosition.x * 8,
                          rotateX: mousePosition.y * -5,
                          z: 50,
                        }
                  }
                  whileTap={{ scale: 0.98 }}
                  className={`relative w-full p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border transition-all duration-300 sm:duration-500 text-left overflow-hidden transform-gpu will-change-transform ${
                    isActive
                      ? 'bg-gradient-to-br from-gray-900/90 to-gray-950/90 border-cyan-500/60 shadow-lg sm:shadow-2xl shadow-cyan-500/25'
                      : 'bg-gradient-to-br from-gray-900/60 to-gray-950/60 border-white/10 sm:border-white/5 sm:hover:border-cyan-500/30'
                  }`}
                  style={{
                    backdropFilter: isMobile ? 'none' : 'blur(20px)',
                    WebkitBackdropFilter: isMobile ? 'none' : 'blur(20px)',
                    transformStyle: isMobile ? 'flat' : 'preserve-3d',
                    boxShadow: isActive
                      ? `0 15px 30px -8px rgba(6, 182, 212, 0.2)`
                      : `0 4px 12px -2px rgba(0, 0, 0, 0.2)`,
                  }}
                >
                  {/* Enhanced glow effects - disabled on mobile */}
                  {!isMobile && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: `conic-gradient(from 0deg, transparent, rgba(6, 182, 212, 0.1), transparent, rgba(59, 130, 246, 0.1), transparent)`,
                        transform: 'translateZ(-1px)',
                      }}
                      animate={{
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  )}

                  {/* Animated edge lighting */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(135deg, transparent 40%, rgba(6, 182, 212, 0.1) 50%, transparent 60%)`,
                      transform: 'translateZ(-0.5px)',
                    }}
                    animate={{
                      backgroundPosition: isHovering
                        ? ['0% 0%', '100% 100%']
                        : '0% 0%',
                    }}
                    transition={{
                      duration: 2,
                      repeat: isHovering ? Infinity : 0,
                      ease: 'linear',
                    }}
                  />

                  {/* Enhanced micro-visual with depth */}
                  <motion.div
                    className="relative"
                    style={{
                      transform: 'translateZ(10px)',
                    }}
                  >
                    <IndustryMicroVisual
                      type={industry.title.toLowerCase().replace(/\s+/g, '')}
                      active={isActive}
                    />
                  </motion.div>

                  <div
                    className="relative z-20"
                    style={{ transform: 'translateZ(20px)' }}
                  >
                    <motion.div
                      className={`inline-flex p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br ${industry.color} mb-2 sm:mb-4 transition-all duration-300 sm:duration-500 shadow-md sm:shadow-lg`}
                      animate={
                        isMobile
                          ? { scale: isActive ? 1.05 : 1 }
                          : {
                              scale: isActive ? 1.15 : 1,
                              rotate: isActive ? [0, 8, -8, 0] : 0,
                              boxShadow: isActive
                                ? `0 20px 40px -10px rgba(6, 182, 212, 0.4)`
                                : `0 8px 16px -4px rgba(0, 0, 0, 0.3)`,
                            }
                      }
                      transition={{
                        scale: { duration: 0.3, ease: 'easeOut' },
                        rotate: {
                          duration: 3,
                          repeat: isActive && !isMobile ? Infinity : 0,
                          ease: 'easeInOut',
                        },
                        boxShadow: { duration: 0.3 },
                      }}
                      whileHover={
                        isMobile
                          ? {}
                          : {
                              scale: 1.2,
                              rotate: 5,
                            }
                      }
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                    </motion.div>

                    <motion.h3
                      className="font-semibold sm:font-bold text-sm sm:text-base lg:text-xl group-hover:text-cyan-300 transition-colors duration-300"
                      animate={{
                        color: isActive
                          ? 'rgb(103, 232, 249)'
                          : 'rgb(255, 255, 255)',
                      }}
                    >
                      {industry.title}
                    </motion.h3>
                  </div>

                  {/* Selection indicator */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isActive ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{
                      borderRadius: '0 0 0.75rem 0.75rem',
                    }}
                  />
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Detail panel - simplified on mobile */}
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.98 }}
          transition={{
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="relative p-5 sm:p-8 lg:p-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-white/10 shadow-lg sm:shadow-2xl overflow-hidden"
          style={{
            backdropFilter: isMobile ? 'none' : 'blur(40px)',
            WebkitBackdropFilter: isMobile ? 'none' : 'blur(40px)',
            transform: isMobile
              ? 'none'
              : `translateY(${mousePosition.y * -5}px) translateX(${mousePosition.x * -3}px)`,
          }}
        >
          {/* Dynamic content background - simplified on mobile */}
          {!isMobile && (
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                background: [
                  `linear-gradient(135deg, ${industries[activeIndex].color.replace('from-', 'rgba(').replace(' to-', ', 0.1), rgba(').replace('-', ' ').replace('400', '59').replace('600', '130').replace('500', '85')}, 0.05))`,
                  `linear-gradient(225deg, ${industries[activeIndex].color.replace('from-', 'rgba(').replace(' to-', ', 0.05), rgba(').replace('-', ' ').replace('400', '59').replace('600', '130').replace('500', '85')}, 0.1))`,
                  `linear-gradient(135deg, ${industries[activeIndex].color.replace('from-', 'rgba(').replace(' to-', ', 0.1), rgba(').replace('-', ' ').replace('400', '59').replace('600', '130').replace('500', '85')}, 0.05))`,
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Floating data elements - hidden on mobile */}
          {!isMobile &&
            Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`data-${activeIndex}-${i}`}
                className={`absolute w-2 h-2 rounded-full bg-gradient-to-r ${industries[activeIndex].color} opacity-20`}
                style={{
                  left: `${15 + i * 10}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
                animate={{
                  x: [0, Math.sin(i) * 20, 0],
                  y: [0, Math.cos(i) * 15, 0],
                  scale: [1, 1.5, 1],
                  opacity: [0.1, 0.4, 0.1],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.2,
                }}
              />
            ))}

          <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.h3
                className="text-4xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent"
                layoutId={`title-${activeIndex}`}
              >
                {industries[activeIndex].title}
              </motion.h3>

              <motion.p
                className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-10 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {industries[activeIndex].description}
              </motion.p>

              <div className="space-y-3 sm:space-y-5">
                {industries[activeIndex].features.map((feature, i) => (
                  <motion.div
                    key={`${activeIndex}-${feature}`}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.25 + i * 0.08,
                    }}
                    className="flex items-center gap-3 sm:gap-4 group sm:hover:scale-105 transition-transform duration-200"
                  >
                    <motion.div
                      className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r ${industries[activeIndex].color} shadow-md sm:shadow-lg flex-shrink-0`}
                      whileHover={isMobile ? {} : { scale: 1.5, rotate: 180 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    />
                    <span className="text-sm sm:text-base text-gray-200 font-medium group-hover:text-cyan-300 transition-colors">
                      {feature}
                    </span>
                    <motion.div
                      className="ml-auto w-8 sm:w-12 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent hidden sm:block"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.08 }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative text-center p-8 sm:p-12 lg:p-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-white/10 shadow-lg sm:shadow-xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={
                isMobile
                  ? {}
                  : {
                      scale: 1.02,
                      boxShadow: `0 30px 60px -12px rgba(6, 182, 212, 0.4)`,
                    }
              }
              style={{
                backdropFilter: isMobile ? 'none' : 'blur(20px)',
                WebkitBackdropFilter: isMobile ? 'none' : 'blur(20px)',
                transform: isMobile
                  ? 'none'
                  : `perspective(1000px) rotateX(${mousePosition.y * -2}deg) rotateY(${mousePosition.x * 2}deg)`,
              }}
            >
              {/* Stats background effect - simplified on mobile */}
              {!isMobile && (
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${industries[activeIndex].color} opacity-5`}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.05, 0.15, 0.05],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}

              <motion.div
                className={`relative text-4xl sm:text-5xl lg:text-7xl font-bold bg-gradient-to-r ${industries[activeIndex].color} bg-clip-text text-transparent mb-4 sm:mb-6`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 15,
                  delay: 0.3,
                }}
                layoutId={isMobile ? undefined : `stats-${activeIndex}`}
              >
                {industries[activeIndex].stats.value}
              </motion.div>

              <motion.div
                className="text-gray-300 text-sm sm:text-base lg:text-lg font-medium"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                {industries[activeIndex].stats.label}
              </motion.div>

              {/* Animated border - hidden on mobile */}
              {!isMobile && (
                <motion.div
                  className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-transparent"
                  style={{
                    background: `linear-gradient(45deg, transparent, ${industries[activeIndex].color.replace('from-', '').replace(' to-', ', ')}) border-box`,
                    mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                  }}
                  animate={{
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// SECURITY COMPONENT
// ============================================

const securityFeatures = [
  {
    icon: Shield,
    title: 'SOC 2 Type II',
    description: 'Independently audited security controls',
  },
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'AES-256 encryption at rest and in transit',
  },
  {
    icon: Eye,
    title: 'Complete Audit Logs',
    description: 'Every action tracked and timestamped',
  },
  {
    icon: Key,
    title: 'SSO & MFA',
    description: 'Google OAuth + Enterprise SAML with TOTP',
  },
];

function Security() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Detect mobile for performance optimization
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Enhanced enterprise evidence chain with audit trails - skip on mobile
  useEffect(() => {
    if (isMobile) return; // Skip canvas animation on mobile for performance

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 500 * dpr;
      canvas.height = 400 * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = '500px';
      canvas.style.height = '400px';
    };
    updateSize();

    let time = 0;

    // Evidence processing pipeline
    const evidenceBlocks = [
      {
        x: 80,
        y: 200,
        label: 'COLLECT',
        stage: 'input',
        locked: false,
        verified: false,
      },
      {
        x: 160,
        y: 200,
        label: 'ENCRYPT',
        stage: 'process',
        locked: false,
        verified: false,
      },
      {
        x: 240,
        y: 200,
        label: 'VERIFY',
        stage: 'validate',
        locked: false,
        verified: false,
      },
      {
        x: 320,
        y: 200,
        label: 'AUDIT',
        stage: 'review',
        locked: false,
        verified: false,
      },
      {
        x: 400,
        y: 200,
        label: 'SECURE',
        stage: 'complete',
        locked: false,
        verified: false,
      },
    ];

    // Audit trace lines that flow through the system
    const auditTraces = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 50 + Math.random() * 400,
      y: 100 + Math.random() * 200,
      speed: 0.5 + Math.random() * 1.5,
      opacity: 0.1 + Math.random() * 0.3,
      direction: Math.random() > 0.5 ? 1 : -1,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, 500, 400);

      // Background audit grid - subtle enterprise feel
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const y = 50 + i * 30;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(450, y);
        ctx.stroke();
      }

      // Animated audit trace lines flowing through the protective surface
      auditTraces.forEach((trace, i) => {
        const traceTime = (time + i * 50) * 0.02;
        trace.x += trace.speed * trace.direction;

        // Wrap around
        if (trace.x > 500) trace.x = -20;
        if (trace.x < -20) trace.x = 500;

        // Create flowing audit lines
        const gradient = ctx.createLinearGradient(
          trace.x - 30,
          trace.y,
          trace.x + 30,
          trace.y,
        );
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
        gradient.addColorStop(
          0.5,
          `rgba(6, 182, 212, ${trace.opacity * (0.5 + Math.sin(traceTime) * 0.3)})`,
        );
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(trace.x - 20, trace.y);
        ctx.lineTo(trace.x + 20, trace.y);
        ctx.stroke();
      });

      // Evidence processing chain
      evidenceBlocks.forEach((block, i) => {
        const blockTime = (time - i * 200) % 1000;
        const isProcessing = blockTime > 0 && blockTime < 800;
        const isLocked = blockTime > 400;
        const isVerified = blockTime > 600;

        block.locked = isLocked;
        block.verified = isVerified;

        // Block container with enterprise styling
        const containerGradient = ctx.createLinearGradient(
          block.x - 30,
          block.y - 20,
          block.x + 30,
          block.y + 20,
        );

        if (isVerified) {
          containerGradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
          containerGradient.addColorStop(1, 'rgba(5, 150, 105, 0.1)');
        } else if (isProcessing) {
          containerGradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
          containerGradient.addColorStop(1, 'rgba(37, 99, 235, 0.1)');
        } else {
          containerGradient.addColorStop(0, 'rgba(75, 85, 99, 0.2)');
          containerGradient.addColorStop(1, 'rgba(55, 65, 81, 0.1)');
        }

        ctx.fillStyle = containerGradient;
        ctx.fillRect(block.x - 30, block.y - 20, 60, 40);

        // Block border
        ctx.strokeStyle = isVerified
          ? 'rgba(16, 185, 129, 0.8)'
          : isProcessing
            ? 'rgba(59, 130, 246, 0.6)'
            : 'rgba(156, 163, 175, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(block.x - 30, block.y - 20, 60, 40);

        // Processing animation inside block
        if (isProcessing && !isVerified) {
          const dots = 3;
          for (let d = 0; d < dots; d++) {
            const dotOpacity = Math.max(0, Math.sin(time * 0.05 - d * 0.5));
            ctx.fillStyle = `rgba(59, 130, 246, ${dotOpacity})`;
            ctx.beginPath();
            ctx.arc(block.x - 10 + d * 10, block.y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Verification checkmark
        if (isVerified) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(block.x - 8, block.y);
          ctx.lineTo(block.x - 3, block.y + 5);
          ctx.lineTo(block.x + 8, block.y - 5);
          ctx.stroke();
        }

        // Security lock icon for locked blocks
        if (isLocked) {
          const lockY = block.y - 35;

          // Lock glow
          const lockGlow = ctx.createRadialGradient(
            block.x,
            lockY,
            0,
            block.x,
            lockY,
            12,
          );
          lockGlow.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
          lockGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
          ctx.fillStyle = lockGlow;
          ctx.beginPath();
          ctx.arc(block.x, lockY, 12, 0, Math.PI * 2);
          ctx.fill();

          // Lock body
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(block.x - 4, lockY - 2, 8, 6);

          // Lock shackle
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(block.x, lockY - 3, 3, Math.PI, 0);
          ctx.stroke();
        }

        // Stage label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(block.label, block.x, block.y + 35);

        // Connection chains between blocks
        if (i < evidenceBlocks.length - 1) {
          const nextBlock = evidenceBlocks[i + 1];
          const connectionActive =
            block.verified && (nextBlock.locked || nextBlock.verified);

          // Chain link background
          ctx.strokeStyle = connectionActive
            ? 'rgba(16, 185, 129, 0.7)'
            : 'rgba(156, 163, 175, 0.3)';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(block.x + 30, block.y);
          ctx.lineTo(nextBlock.x - 30, nextBlock.y);
          ctx.stroke();

          // Chain link highlight
          ctx.strokeStyle = connectionActive
            ? 'rgba(255, 255, 255, 0.4)'
            : 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(block.x + 30, block.y - 1);
          ctx.lineTo(nextBlock.x - 30, nextBlock.y - 1);
          ctx.stroke();

          // Data flow pulses
          if (connectionActive) {
            const pulseProgress = (time * 0.03 + i * 0.3) % 1;
            const pulseX =
              block.x +
              30 +
              (nextBlock.x - 30 - (block.x + 30)) * pulseProgress;
            const pulseGradient = ctx.createRadialGradient(
              pulseX,
              block.y,
              0,
              pulseX,
              block.y,
              6,
            );
            pulseGradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
            pulseGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
            ctx.fillStyle = pulseGradient;
            ctx.beginPath();
            ctx.arc(pulseX, block.y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Central security shield mesh
      const shieldCenterX = 250;
      const shieldCenterY = 120;
      const shieldSize = 40;

      // Shield background with subtle mesh pattern
      const shieldGradient = ctx.createRadialGradient(
        shieldCenterX,
        shieldCenterY,
        0,
        shieldCenterX,
        shieldCenterY,
        shieldSize,
      );
      shieldGradient.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
      shieldGradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.1)');
      shieldGradient.addColorStop(1, 'rgba(6, 182, 212, 0.05)');
      ctx.fillStyle = shieldGradient;

      // Shield shape
      ctx.beginPath();
      ctx.moveTo(shieldCenterX, shieldCenterY - shieldSize);
      ctx.lineTo(
        shieldCenterX - shieldSize * 0.7,
        shieldCenterY - shieldSize * 0.5,
      );
      ctx.lineTo(
        shieldCenterX - shieldSize * 0.7,
        shieldCenterY + shieldSize * 0.3,
      );
      ctx.lineTo(shieldCenterX, shieldCenterY + shieldSize);
      ctx.lineTo(
        shieldCenterX + shieldSize * 0.7,
        shieldCenterY + shieldSize * 0.3,
      );
      ctx.lineTo(
        shieldCenterX + shieldSize * 0.7,
        shieldCenterY - shieldSize * 0.5,
      );
      ctx.closePath();
      ctx.fill();

      // Shield mesh pattern
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      for (let i = 0; i < 6; i++) {
        const y = shieldCenterY - shieldSize * 0.8 + i * (shieldSize * 0.3);
        ctx.beginPath();
        ctx.moveTo(shieldCenterX - shieldSize * 0.6, y);
        ctx.lineTo(shieldCenterX + shieldSize * 0.6, y);
        ctx.stroke();
      }

      // Shield border with enterprise styling
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shieldCenterX, shieldCenterY - shieldSize);
      ctx.lineTo(
        shieldCenterX - shieldSize * 0.7,
        shieldCenterY - shieldSize * 0.5,
      );
      ctx.lineTo(
        shieldCenterX - shieldSize * 0.7,
        shieldCenterY + shieldSize * 0.3,
      );
      ctx.lineTo(shieldCenterX, shieldCenterY + shieldSize);
      ctx.lineTo(
        shieldCenterX + shieldSize * 0.7,
        shieldCenterY + shieldSize * 0.3,
      );
      ctx.lineTo(
        shieldCenterX + shieldSize * 0.7,
        shieldCenterY - shieldSize * 0.5,
      );
      ctx.closePath();
      ctx.stroke();

      // Enterprise compliance badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SOC 2', shieldCenterX, shieldCenterY + 5);

      // Audit compliance indicator
      ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.font = '8px monospace';
      ctx.fillText('TYPE II COMPLIANT', shieldCenterX, shieldCenterY + 65);

      time += 1;
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      // Cleanup will happen when component unmounts
    };
  }, [isMobile]);

  return (
    <section
      ref={containerRef}
      className="relative py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-[#0a0f1c] to-[#0d1421] overflow-hidden"
      style={{ position: 'relative' }}
    >
      {/* Background effects - simplified on mobile */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[450px] lg:w-[600px] h-[300px] sm:h-[450px] lg:h-[600px] bg-cyan-500/5 rounded-full blur-2xl sm:blur-3xl will-change-transform"
          style={{ transform: 'translateZ(0)' }}
        />

        {/* Subtle audit trace overlay - hidden on mobile */}
        <div
          className="absolute inset-0 opacity-10 sm:opacity-20 hidden sm:block"
          style={{
            backgroundImage: `linear-gradient(45deg, transparent 40%, rgba(6, 182, 212, 0.03) 50%, transparent 60%)`,
            backgroundSize: '60px 60px',
            animation: 'audit-flow 8s linear infinite',
          }}
        />
      </div>

      <motion.div
        style={{ opacity: isMobile ? 1 : opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12"
      >
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: isMobile ? 0 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Label badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6"
            >
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-blue-400 animate-pulse" />
              Enterprise Security
            </motion.div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Security Built Into
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
                {' '}
                the Operating Layer
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-3 sm:mb-4 leading-relaxed">
              Controls are enforced, not just recorded. Every action is
              verified, every evidence chain is immutable, every audit trail is
              complete.
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 leading-relaxed">
              Security is infrastructure, not features. Built into the operating
              layer where controls execute automatically and evidence is
              captured at the system level.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {securityFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="flex gap-3 sm:gap-4 group sm:hover:scale-105 transition-transform duration-200 will-change-transform"
                  >
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center sm:group-hover:shadow-lg sm:group-hover:shadow-cyan-500/25 transition-shadow">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base mb-0.5 sm:mb-1 group-hover:text-cyan-300 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Enhanced Visual - Canvas on desktop, static on mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center order-first lg:order-last"
          >
            <div
              className="relative p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-gray-900/30 to-gray-950/30 border border-white/5 w-full max-w-[500px] overflow-hidden"
              style={{ backdropFilter: isMobile ? 'none' : 'blur(20px)' }}
            >
              {/* Desktop: Canvas animation */}
              {!isMobile && (
                <canvas ref={canvasRef} className="w-full h-full" />
              )}

              {/* Mobile: Static visual representation */}
              {isMobile && (
                <div className="relative h-[250px] sm:h-[300px]">
                  {/* SOC 2 Shield */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-20 flex flex-col items-center justify-center">
                    <div className="w-14 h-16 border-2 border-cyan-400/60 rounded-b-full rounded-t-lg bg-gradient-to-b from-cyan-500/10 to-transparent flex items-center justify-center">
                      <span className="text-white/80 text-xs font-mono">
                        SOC 2
                      </span>
                    </div>
                    <span className="text-cyan-400/60 text-[8px] font-mono mt-1">
                      TYPE II COMPLIANT
                    </span>
                  </div>

                  {/* Evidence Chain Labels */}
                  <div className="absolute bottom-6 left-0 right-0 flex justify-between px-4 text-[10px] font-mono text-cyan-400/60">
                    <span className="text-center">COLLECT</span>
                    <span className="text-center">ENCRYPT</span>
                    <span className="text-center">VERIFY</span>
                    <span className="text-center">AUDIT</span>
                  </div>

                  {/* Evidence blocks */}
                  <div className="absolute bottom-12 left-0 right-0 flex justify-between px-4 gap-2">
                    {['COLLECT', 'ENCRYPT', 'VERIFY', 'AUDIT'].map(
                      (label, i) => (
                        <div
                          key={label}
                          className={`flex-1 h-8 rounded border ${i < 3 ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-blue-500/50 bg-blue-500/10'}`}
                        />
                      ),
                    )}
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c]/10 via-transparent to-transparent rounded-2xl sm:rounded-3xl pointer-events-none" />

              {/* Enterprise compliance indicators */}
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex justify-between items-center text-[10px] sm:text-xs text-gray-500 font-mono">
                <span>AUDIT STATUS: ACTIVE</span>
                <span className="hidden sm:inline">COMPLIANCE: 100%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes audit-flow {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 60px 60px;
          }
        }
      `}</style>
    </section>
  );
}

// ============================================
// CTA SECTION COMPONENT
// ============================================

function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctaButtonRef = useRef<HTMLAnchorElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const glow = useTransform(scrollYProgress, [0, 1], [0.2, 0.6]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Enhanced ambient particle field and process-to-proof arc animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 800 * dpr;
      canvas.height = 600 * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = '800px';
      canvas.style.height = '600px';
    };
    updateSize();

    let time = 0;

    // Ambient proof particles that converge toward center
    const proofParticles = Array.from({ length: 25 }, (_, i) => ({
      x: 100 + Math.random() * 600,
      y: 100 + Math.random() * 400,
      targetX: 400,
      targetY: 300,
      speed: 0.5 + Math.random() * 1,
      size: 1 + Math.random() * 3,
      opacity: 0.3 + Math.random() * 0.4,
      verified: false,
      verifyTime: 200 + i * 80,
    }));

    // Process-to-Proof Arc elements
    const arcSegments = [
      { label: 'MODEL', x: 150, y: 300, progress: 0 },
      { label: 'EXECUTE', x: 300, y: 280, progress: 0 },
      { label: 'VERIFY', x: 450, y: 280, progress: 0 },
      { label: 'PROVE', x: 600, y: 300, progress: 0 },
    ];

    const animate = () => {
      ctx.clearRect(0, 0, 800, 600);

      // Volumetric gradient background layers
      const bgGradient1 = ctx.createRadialGradient(400, 300, 0, 400, 300, 400);
      bgGradient1.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
      bgGradient1.addColorStop(0.5, 'rgba(59, 130, 246, 0.03)');
      bgGradient1.addColorStop(1, 'rgba(147, 51, 234, 0.02)');
      ctx.fillStyle = bgGradient1;
      ctx.fillRect(0, 0, 800, 600);

      // Soft animated light sweep
      const sweepAngle = (time * 0.002) % (Math.PI * 2);
      const sweepGradient = ctx.createLinearGradient(
        400 + Math.cos(sweepAngle) * 300,
        300 + Math.sin(sweepAngle) * 300,
        400 + Math.cos(sweepAngle + Math.PI) * 300,
        300 + Math.sin(sweepAngle + Math.PI) * 300,
      );
      sweepGradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
      sweepGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.08)');
      sweepGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = sweepGradient;
      ctx.fillRect(0, 0, 800, 600);

      // Parallax depth layer - slow moving nodes
      for (let i = 0; i < 8; i++) {
        const depthX = 100 + i * 100 + Math.sin(time * 0.001 + i) * 30;
        const depthY = 150 + Math.sin(time * 0.0008 + i * 0.5) * 100;
        const depthOpacity = 0.1 + Math.sin(time * 0.001 + i) * 0.05;

        const depthGradient = ctx.createRadialGradient(
          depthX,
          depthY,
          0,
          depthX,
          depthY,
          20,
        );
        depthGradient.addColorStop(0, `rgba(59, 130, 246, ${depthOpacity})`);
        depthGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = depthGradient;
        ctx.beginPath();
        ctx.arc(depthX, depthY, 15, 0, Math.PI * 2);
        ctx.fill();
      }

      // Evidence node halo - particles converging toward center
      proofParticles.forEach((particle, particleIndex) => {
        // Converge animation - accelerates as time progresses
        const convergeFactor = Math.min(time / 2000, 1);
        particle.x +=
          (particle.targetX - particle.x) *
          0.01 *
          particle.speed *
          (0.5 + convergeFactor);
        particle.y +=
          (particle.targetY - particle.y) *
          0.01 *
          particle.speed *
          (0.5 + convergeFactor);

        // Verify particles as they approach center
        const distanceToCenter = Math.sqrt(
          Math.pow(particle.x - particle.targetX, 2) +
            Math.pow(particle.y - particle.targetY, 2),
        );

        if (time > particle.verifyTime && distanceToCenter < 80) {
          particle.verified = true;
        }

        // Particle glow
        const particleGradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 3,
        );

        if (particle.verified) {
          particleGradient.addColorStop(
            0,
            `rgba(16, 185, 129, ${particle.opacity})`,
          );
          particleGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        } else {
          particleGradient.addColorStop(
            0,
            `rgba(6, 182, 212, ${particle.opacity * 0.7})`,
          );
          particleGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        }

        ctx.fillStyle = particleGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Verification pulse
        if (particle.verified) {
          const pulseSize =
            particle.size * (2 + Math.sin(time * 0.01 + particleIndex * 0.3));
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.3 - (pulseSize - particle.size * 2) * 0.05})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Process-to-Proof Arc - animated progression
      arcSegments.forEach((segment, i) => {
        const segmentTime = (time - i * 300) % 2000;
        segment.progress = Math.max(0, Math.min(1, (segmentTime - 200) / 800));

        // Segment node
        const nodeGradient = ctx.createRadialGradient(
          segment.x,
          segment.y,
          0,
          segment.x,
          segment.y,
          15,
        );
        if (segment.progress > 0.8) {
          nodeGradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
          nodeGradient.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
        } else if (segment.progress > 0.3) {
          nodeGradient.addColorStop(0, 'rgba(59, 130, 246, 0.6)');
          nodeGradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
        } else {
          nodeGradient.addColorStop(0, 'rgba(156, 163, 175, 0.4)');
          nodeGradient.addColorStop(1, 'rgba(156, 163, 175, 0.1)');
        }

        ctx.fillStyle = nodeGradient;
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Arc connection to next segment
        if (i < arcSegments.length - 1) {
          const nextSegment = arcSegments[i + 1];
          const connectionProgress = Math.max(
            0,
            Math.min(1, (segment.progress - 0.5) * 2),
          );

          if (connectionProgress > 0) {
            // Arc path
            const midX = (segment.x + nextSegment.x) / 2;
            const midY = Math.min(segment.y, nextSegment.y) - 40;

            ctx.strokeStyle =
              segment.progress > 0.8
                ? `rgba(16, 185, 129, ${0.6 * connectionProgress})`
                : `rgba(59, 130, 246, ${0.4 * connectionProgress})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(segment.x, segment.y);
            ctx.quadraticCurveTo(midX, midY, nextSegment.x, nextSegment.y);
            ctx.stroke();

            // Flow pulse along arc
            if (connectionProgress > 0.7) {
              const pulseProgress = (time * 0.02 + i * 0.5) % 1;
              const pulseX =
                segment.x + (nextSegment.x - segment.x) * pulseProgress;
              const pulseY =
                segment.y +
                (nextSegment.y - segment.y) * pulseProgress -
                Math.sin(pulseProgress * Math.PI) * 40;

              const pulseGradient = ctx.createRadialGradient(
                pulseX,
                pulseY,
                0,
                pulseX,
                pulseY,
                6,
              );
              pulseGradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
              pulseGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
              ctx.fillStyle = pulseGradient;
              ctx.beginPath();
              ctx.arc(pulseX, pulseY, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Segment label
        ctx.fillStyle =
          segment.progress > 0.8
            ? 'rgba(255, 255, 255, 0.9)'
            : segment.progress > 0.3
              ? 'rgba(255, 255, 255, 0.7)'
              : 'rgba(156, 163, 175, 0.6)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(segment.label, segment.x, segment.y + 25);
      });

      // Central convergence point - the "proof" destination
      const centerGradient = ctx.createRadialGradient(
        400,
        300,
        0,
        400,
        300,
        30,
      );
      centerGradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
      centerGradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.1)');
      centerGradient.addColorStop(1, 'rgba(6, 182, 212, 0.05)');
      ctx.fillStyle = centerGradient;
      ctx.beginPath();
      ctx.arc(400, 300, 25, 0, Math.PI * 2);
      ctx.fill();

      // Central proof symbol
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(392, 300);
      ctx.lineTo(397, 305);
      ctx.lineTo(408, 294);
      ctx.stroke();

      time += 16;
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      // Cleanup animation frame
    };
  }, []);

  // CTA button pulse effect
  useEffect(() => {
    const button = ctaButtonRef.current;
    if (!button) return;

    const pulseInterval = setInterval(() => {
      button.style.boxShadow = '0 0 40px rgba(6, 182, 212, 0.7)';
      setTimeout(() => {
        button.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.3)';
      }, 800);
    }, 7000);

    return () => clearInterval(pulseInterval);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative py-32 bg-gradient-to-b from-[#0d1421] to-[#0a0f1c] overflow-hidden"
      style={{ position: 'relative' }}
    >
      {/* Enhanced Background Motion Layers - Full Bleed */}
      <motion.div
        style={{ opacity: glow }}
        className="fixed inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-purple-500/20 pointer-events-none"
      />

      <motion.div
        style={{ y: backgroundY }}
        className="fixed inset-0 pointer-events-none"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10" />

        {/* Radial glow centers - Extended beyond container */}
        <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vh] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vh] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-purple-500/3 rounded-full blur-3xl" />
      </motion.div>

      {/* Proof-oriented visual element - Full Width */}
      <motion.div
        style={{ opacity }}
        className="fixed inset-0 flex items-center justify-center pointer-events-none"
      >
        <canvas ref={canvasRef} className="opacity-60" />
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          style={{ scale }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Enhanced badge with micro-motion */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </motion.div>
            <span className="text-sm text-cyan-400 font-medium">
              Start Your Free Trial
            </span>
          </motion.div>

          {/* Enhanced title with gradient text on key words */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            Install the{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Operating System
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
              Your Compliance Deserves
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Stop managing compliance manually. FormaOS enforces controls,
            captures evidence, and keeps you audit-ready—every single day.
          </motion.p>

          {/* Enhanced CTA buttons with improved micro-interactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.a
              ref={ctaButtonRef}
              href="/auth"
              whileHover={{
                scale: 1.05,
                boxShadow:
                  '0 0 40px rgba(6, 182, 212, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.1)',
              }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg flex items-center gap-2 transition-all duration-300 shadow-lg shadow-cyan-500/25"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </motion.a>

            <motion.a
              href="/contact"
              whileHover={{
                scale: 1.05,
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
                backgroundColor: 'rgba(6, 182, 212, 0.05)',
              }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-full border-2 border-gray-600 text-white font-semibold text-lg hover:border-cyan-400 transition-all duration-300"
            >
              Schedule Demo
            </motion.a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-sm text-gray-500 mt-8"
          >
            No credit card required • 14-day free trial • Cancel anytime
          </motion.p>

          {/* High-Trust Data Strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-16 pt-8 border-t border-white/5"
          >
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-center">
              {[
                { value: '99.9%', label: 'Audit Success' },
                { value: '50M+', label: 'Evidence Records' },
                { value: 'SOC 2', label: 'Type II Compliant' },
                { value: '24/7', label: 'Enterprise Support' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex flex-col items-center min-w-0"
                >
                  <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Additional volumetric lighting effect - Full Bleed */}
      <div className="fixed inset-0 bg-gradient-to-t from-[#0a0f1c]/50 via-transparent to-transparent pointer-events-none" />
    </section>
  );
}

// ============================================
// TRUST SECTION COMPONENT
// ============================================

const trustedBy = [
  'Royal Melbourne Hospital',
  'Australian Unity',
  'Westpac Group',
  'University of Sydney',
  'NSW Government',
  'Aged Care Quality',
  'MedHealth Group',
  'Education Queensland',
];

function TrustSection() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-[#0a0f1c] to-[#080c16] border-y border-white/5 overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-sm uppercase tracking-wider text-gray-500 mb-8">
            Trusted by leading organizations
          </p>
        </motion.div>

        {/* Logo Grid with glassmorphism */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {trustedBy.map((company, index) => (
            <motion.div
              key={company}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group relative flex items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-gray-900/30 to-gray-950/30 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-300 cursor-pointer shadow-lg shadow-black/10"
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/5 transition-all duration-500" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/0 group-hover:via-cyan-400/40 to-transparent transition-all duration-500" />

              <span className="relative text-gray-400 group-hover:text-cyan-400 transition-colors duration-300 text-sm font-medium text-center">
                {company}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Stats Row with enhanced visuals */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
          {[
            { value: '99.9%', label: 'System Uptime' },
            { value: '50M+', label: 'Evidence Records' },
            { value: '100%', label: 'Audit Pass Rate' },
            { value: '<5min', label: 'Evidence Retrieval' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -3 }}
              className="text-center p-4 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-default"
            >
              <motion.div
                className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + index * 0.15 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-xs sm:text-sm text-gray-500">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// MAIN HOMEPAGE COMPONENT (exports the complete homepage)
// ============================================

export default function FormaOSHomepage() {
  return (
    <MotionProvider>
      <ComplianceProvider>
        <div className="figma-homepage relative min-h-screen bg-[#0a0f1c] overflow-x-hidden">
          {/* Enhanced Global Particle Field - Performance Optimized */}
          <div className="fixed inset-0 z-0">
            <div className="opacity-40">
              <CinematicField />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
          </div>

          {/* Global WebGL Node System */}
          <div className="fixed inset-0 z-1 opacity-20 pointer-events-none">
            <WebGLNodeField state="model" />
          </div>

          {/* All sections with enhanced depth */}
          <div className="relative z-10">
            <Hero />
            <ValueProposition />
            <ScrollStory />
            <CapabilitiesGrid />
            <Industries />
            <Security />
            <CTASection />
            <TrustSection />
          </div>
        </div>
      </ComplianceProvider>
    </MotionProvider>
  );
}
