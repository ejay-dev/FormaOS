'use client';

import { VisualDivider } from '@/components/motion';
import CinematicField from '../components/motion/CinematicField';
import { DocsHero, DocsContent, APIPreview, DocsCTA } from './components';

export default function DocsPageContent() {
  return (
    <div className="relative min-h-screen bg-[#0a0f1c]">
      {/* Fixed particle background */}
      <div className="fixed inset-0 z-0">
        <div className="opacity-30">
          <CinematicField />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 via-transparent to-emerald-500/3" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <DocsHero />
        <VisualDivider gradient />
        <DocsContent />
        <VisualDivider gradient />
        <APIPreview />
        <VisualDivider gradient />
        <DocsCTA />
      </div>
    </div>
  );
}
