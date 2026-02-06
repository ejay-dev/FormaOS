/**
 * Demo Mode Toggle Button
 * Entry point to launch guided demo mode
 */

'use client';

import { useState } from 'react';
import { useDemo } from '@/lib/demo/demo-context';
import { Play, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DemoModeToggleProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onDemoStart?: () => void;
}

export function DemoModeToggle({
  variant = 'default',
  size = 'default',
  className = '',
  onDemoStart,
}: DemoModeToggleProps) {
  const { isDemoMode, startDemo } = useDemo();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartDemo = async () => {
    setIsStarting(true);

    try {
      // Call optional callback (e.g., seed demo data)
      if (onDemoStart) {
        await onDemoStart();
      }

      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Start the demo
      startDemo();
    } catch (error) {
      console.error('Failed to start demo:', error);
    } finally {
      setIsStarting(false);
    }
  };

  if (isDemoMode) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-purple-100 rounded-lg border border-purple-300">
        <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
        <span className="text-sm font-medium text-purple-700">Demo Active</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleStartDemo}
      variant={variant}
      size={size}
      disabled={isStarting}
      className={`flex items-center gap-2 ${className}`}
    >
      {isStarting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Starting Demo...
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          Enter Guided Demo Mode
        </>
      )}
    </Button>
  );
}
