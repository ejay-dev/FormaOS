"use client";

import dynamic from "next/dynamic";
import { Suspense, Component, ErrorInfo, ReactNode, useState, useEffect } from "react";

// Error boundary to catch and display errors in dynamic components
class ComponentErrorBoundary extends Component<
  { name: string; children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { name: string; children: ReactNode; fallback?: ReactNode }) {
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
      if (this.props.fallback) {
        return this.props.fallback;
      }
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
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn btn-secondary text-sm px-4 py-2"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Simple fallback hero for when animations fail
function SimpleHero() {
  return (
    <section className="min-h-[100svh] md:min-h-[90vh] flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full glass-panel px-4 py-2 text-xs font-bold uppercase tracking-wider mb-6">
          Enterprise Compliance OS
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
          <span className="block">Operational</span>
          <span className="block text-gradient">Compliance</span>
          <span className="block text-3xl md:text-5xl lg:text-6xl text-foreground/90">Operating System</span>
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-8">
          Transform regulatory obligations into executable controls, traceable evidence, and audit-ready governance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/auth/signup" className="btn btn-primary text-lg px-8 py-4">
            Start Free Trial
          </a>
          <a href="/contact" className="btn btn-secondary text-lg px-8 py-4">
            Request Demo
          </a>
        </div>
      </div>
    </section>
  );
}

// Simple fallback content
function SimpleContent() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Real-time compliance intelligence
          </h2>
          <p className="text-lg text-foreground/70">
            FormaOS tracks compliance posture across your entire organization
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "94%", label: "Avg. Posture Score" },
            { value: "127", label: "Active Controls" },
            { value: "<2min", label: "Audit Export Time" },
            { value: "98%", label: "Task Completion" },
          ].map((metric) => (
            <div key={metric.label} className="glass-panel rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{metric.value}</div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
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
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render on client side
  if (!isClient) {
    return (
      <>
        <SimpleHero />
        <SimpleContent />
      </>
    );
  }

  return (
    <>
      {/* Cinematic Hero with 3D modules */}
      <ComponentErrorBoundary name="Hero" fallback={<SimpleHero />}>
        <Suspense fallback={
          <div className="min-h-[100svh] md:min-h-[90vh] flex items-center justify-center bg-background">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        }>
          <CinematicHero />
        </Suspense>
      </ComponentErrorBoundary>

      {/* Rest of the content with motion */}
      <ComponentErrorBoundary name="Content" fallback={<SimpleContent />}>
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
