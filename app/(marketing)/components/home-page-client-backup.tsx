"use client";

import { useState, useEffect } from "react";
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');


// Minimal fallback components for testing
function SimpleHero() {
  return (
    <section className="min-h-[100svh] md:min-h-[90vh] flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
          <span className="block">Operational</span>
          <span className="block text-primary">Compliance</span>
          <span className="block text-3xl md:text-5xl lg:text-6xl text-foreground/90">Operating System</span>
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-8">
          Transform regulatory obligations into executable controls, traceable evidence, and audit-ready governance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href={`${appBase}/auth/signup`} className="btn btn-primary text-lg px-8 py-4">
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

function SimpleContent() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Complete Compliance Platform
          </h2>
          <p className="text-lg text-foreground/70">
            FormaOS provides end-to-end compliance management
          </p>
        </div>
        
        {/* Metrics Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { value: "94%", label: "Avg. Posture Score" },
            { value: "127", label: "Active Controls" },
            { value: "<2min", label: "Audit Export Time" },
            { value: "98%", label: "Task Completion" },
          ].map((metric) => (
            <div key={metric.label} className="bg-background/50 border border-border/50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{metric.value}</div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { title: "Model obligations", description: "Align frameworks, policies, and controls across every site and team." },
            { title: "Execute tasks", description: "Assign remediation work with owners, deadlines, and evidence requirements." },
            { title: "Capture evidence", description: "Store approvals, artifacts, and audit history in a single chain of custody." },
            { title: "Prove readiness", description: "Generate audit bundles, reports, and compliance posture in minutes." }
          ].map((feature, idx) => (
            <div key={idx} className="bg-background/50 border border-border/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-foreground/70">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Industries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { title: "NDIS & disability services", description: "Track practice standards, provider obligations, and incident reporting." },
            { title: "Healthcare providers", description: "Manage credentials, clinical governance, and audit readiness." },
            { title: "Aged care operators", description: "Keep evidence and policy reviews current across multiple sites." },
            { title: "Community services", description: "Prove service quality and compliance across programs and teams." }
          ].map((industry, idx) => (
            <div key={idx} className="bg-background/50 border border-border/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">{industry.title}</h3>
              <p className="text-sm text-foreground/70">{industry.description}</p>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="text-center bg-background/50 border border-border/50 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
          <p className="text-lg text-foreground/70 mb-6">
            Start your 14-day free trial. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={`${appBase}/auth/signup`} className="btn btn-primary text-lg px-8 py-4">
              Start Free Trial
            </a>
            <a href="/contact" className="btn btn-secondary text-lg px-8 py-4">
              Request Demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomePageClient() {
  return (
    <>
      <SimpleHero />
      <SimpleContent />
    </>
  );
}
