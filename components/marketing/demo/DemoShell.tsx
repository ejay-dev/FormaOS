'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { easing, duration } from '@/config/motion';
import DemoSidebar from './DemoSidebar';
import DemoTopBar from './DemoTopBar';
import type { DemoScreenId } from './demo-data';
import type { ReactNode } from 'react';

interface DemoShellProps {
  activeScreen: DemoScreenId;
  onNavigate: (id: DemoScreenId) => void;
  children: ReactNode;
}

const screenTransition = {
  duration: duration.normal,
  ease: easing.signature,
};

export default function DemoShell({ activeScreen, onNavigate, children }: DemoShellProps) {
  return (
    <div className="flex h-full w-full overflow-hidden rounded-b-2xl bg-[#0a0e1a]">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:flex md:w-[180px] lg:w-[200px] flex-shrink-0">
        <DemoSidebar activeScreen={activeScreen} onNavigate={onNavigate} />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        <DemoTopBar />

        {/* Content */}
        <div className="relative flex-1 overflow-hidden bg-[#0b1022]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
              transition={screenTransition}
              className="absolute inset-0 overflow-y-auto overflow-x-hidden p-3 md:p-4"
              tabIndex={0}
              aria-label="Interactive demo content"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
