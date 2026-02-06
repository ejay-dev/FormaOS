/**
 * Demo Mode Banner
 * Persistent banner showing demo mode is active
 */

'use client';

import { useDemo } from '@/lib/demo/demo-context';
import { Sparkles, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DemoBanner() {
  const { isDemoMode, restartDemo, exitDemo } = useDemo();

  if (!isDemoMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Demo indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">You are viewing FormaOS Demo Mode</p>
                <p className="text-xs text-purple-100">
                  Explore features with sample data - No real data is affected
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={restartDemo}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restart Demo
            </Button>
            <Button
              onClick={exitDemo}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Exit Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
