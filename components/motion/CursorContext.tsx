'use client';

import { createContext, useContext, useMemo } from 'react';
import { type MotionValue, motionValue } from 'framer-motion';

interface CursorContextValue {
  /** Normalized cursor X position (0-1), spring-animated */
  mouseX: MotionValue<number>;
  /** Normalized cursor Y position (0-1), spring-animated */
  mouseY: MotionValue<number>;
  /** Whether cursor tracking is currently active (desktop only, no reduced motion) */
  isActive: boolean;
}

export const CursorContext = createContext<CursorContextValue | null>(null);

/** Static fallback MotionValues for when no DepthStage is present */
const STATIC_X = motionValue(0.5);
const STATIC_Y = motionValue(0.5);
const STATIC_CTX: CursorContextValue = { mouseX: STATIC_X, mouseY: STATIC_Y, isActive: false };

/**
 * useCursorPosition
 * ─────────────────
 * Read the cursor position from the nearest DepthStage.
 * Returns static 0.5/0.5 if used outside a DepthStage (safe fallback).
 */
export function useCursorPosition(): CursorContextValue {
  const ctx = useContext(CursorContext);
  return ctx ?? STATIC_CTX;
}
