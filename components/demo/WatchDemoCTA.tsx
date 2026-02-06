/**
 * Watch Demo CTA
 * Marketing call-to-action to launch guided demo instantly
 */

'use client';

import { useState } from 'react';
import { Play, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface WatchDemoCTAProps {
  variant?: 'default' | 'large' | 'inline';
  className?: string;
}

export function WatchDemoCTA({ variant = 'default', className = '' }: WatchDemoCTAProps) {
  const router = useRouter();
  const [isLaunching, setIsLaunching] = useState(false);

  const launchDemo = async () => {
    setIsLaunching(true);

    // Set demo mode in sessionStorage
    sessionStorage.setItem('formaos_demo_mode', 'true');
    sessionStorage.setItem('formaos_demo_step', '0');

    // Small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Navigate to dashboard (demo will auto-start)
    router.push('/app/dashboard');
  };

  if (variant === 'large') {
    return (
      <div className={`relative ${className}`}>
        {/* Premium card design */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-white p-8 shadow-xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                Interactive Demo
              </span>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              See FormaOS Automation in Action
            </h3>
            <p className="text-gray-600 mb-6 max-w-lg">
              Take a guided tour through FormaOS compliance automation. Watch tasks generate
              automatically, see evidence reminders fire, and explore the compliance operating
              system in action.
            </p>

            <Button
              onClick={launchDemo}
              disabled={isLaunching}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {isLaunching ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Launching Demo...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Watch FormaOS Work
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 mt-3">
              ✓ No signup required • ✓ Sample data only • ✓ 5-minute tour
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={launchDemo}
        disabled={isLaunching}
        className={`inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors ${className}`}
      >
        {isLaunching ? (
          <>
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            Launching...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Watch Demo
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    );
  }

  // Default variant
  return (
    <Button
      onClick={launchDemo}
      disabled={isLaunching}
      variant="outline"
      className={`flex items-center gap-2 border-2 border-purple-300 hover:border-purple-600 hover:bg-purple-50 transition-all ${className}`}
    >
      {isLaunching ? (
        <>
          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          Launching...
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          Watch FormaOS Work
        </>
      )}
    </Button>
  );
}
