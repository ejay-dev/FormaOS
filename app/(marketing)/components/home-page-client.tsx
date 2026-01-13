"use client";

import dynamic from "next/dynamic";
import { Suspense, Component, ErrorInfo, ReactNode } from "react";

// Error boundary to catch and display errors in dynamic components
class ComponentErrorBoundary extends Component<
  { name: string; children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { name: string; children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[${this.props.name}] Error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center bg-background/50 px-4">
          <div className="text-center max-w-md">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Failed to load {this.props.name}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || "An unknown error occurred"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn btn-secondary text-sm px-4 py-2"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      <ComponentErrorBoundary name="Hero">
        <Suspense fallback={
          <div className="min-h-[100svh] md:min-h-[90vh] flex items-center justify-center bg-background">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        }>
          <CinematicHero />
        </Suspense>
      </ComponentErrorBoundary>

      {/* Rest of the content with motion */}
      <ComponentErrorBoundary name="Content">
        <Suspense fallback={
          <div className="py-20 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading content...</div>
          </div>
        }>
          <HomePageContent />
        </Suspense>
      </ComponentErrorBoundary>
    </>
  );
}
