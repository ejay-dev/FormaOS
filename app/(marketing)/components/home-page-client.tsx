"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamic imports with SSR disabled for animation-heavy components
const CinematicHero = dynamic(
  () => import("./CinematicHero").then(mod => mod.CinematicHero),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-[100svh] md:min-h-[90vh] flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }
);

const HomePageContent = dynamic(
  () => import("./HomePageContent").then(mod => mod.HomePageContent),
  { 
    ssr: false,
    loading: () => (
      <div className="py-20 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading content...</div>
      </div>
    )
  }
);

export function HomePageClient() {
  return (
    <>
      {/* Cinematic Hero with 3D modules */}
      <Suspense fallback={
        <div className="min-h-[100svh] md:min-h-[90vh] flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }>
        <CinematicHero />
      </Suspense>

      {/* Rest of the content with motion */}
      <Suspense fallback={
        <div className="py-20 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading content...</div>
        </div>
      }>
        <HomePageContent />
      </Suspense>
    </>
  );
}
