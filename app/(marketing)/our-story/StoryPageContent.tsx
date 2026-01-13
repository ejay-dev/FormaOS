"use client";

import Link from "next/link";
import { BookOpen, Target, Users, Shield, Sparkles, Mail, Phone, MapPin } from "lucide-react";
import { 
  CinematicSection,
  SectionHeader,
  TimelineItem,
  NarrativeBlock,
  MissionStatement,
  TeamMember,
  VisualDivider,
  ValueProp
} from "@/components/motion";

export function StoryHero() {
  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">
      {/* Multi-layer background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 flow-lines opacity-30" />
        <div className="absolute inset-0 vignette" />
      </div>

      {/* Ambient lights */}
      <div className="pointer-events-none absolute right-1/4 top-20 h-[600px] w-[600px] rounded-full bg-secondary/8 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 bottom-20 h-[500px] w-[500px] rounded-full bg-primary/6 blur-3xl" />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-24 w-full">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2.5 glass-panel rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-wider mb-8">
            <BookOpen className="h-4 w-4 text-secondary" />
            Our Story
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] font-display tracking-tight mb-6">
            Building infrastructure<br />
            <span className="text-gradient">for operational trust</span>
          </h1>

          <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-3xl mx-auto">
            FormaOS was built to solve a problem that too many regulated teams quietly live with every day: 
            fragmented systems, manual audits, and operational chaos hidden behind spreadsheets.
          </p>
        </div>
      </div>
    </section>
  );
}

export function StoryContent() {
  return (
    <>
      {/* Timeline / Origin story */}
      <CinematicSection 
        backgroundType="grid" 
        ambientColor="primary"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="The Journey"
            title={<>From operational chaos<br /><span className="text-gradient">to system intelligence</span></>}
            subtitle="How FormaOS evolved from real-world compliance challenges"
            alignment="center"
          />

          <div className="space-y-12">
            <TimelineItem
              title="Where It Started"
              description="FormaOS began in Adelaide, South Australia, not in a boardroom—but inside real operational workflows. Healthcare providers, disability services, and multi-site teams were drowning in disconnected tools, duplicated reporting, and audit preparation that stole weeks of productivity."
              icon={<MapPin className="h-6 w-6 text-primary" />}
              delay={0}
            />

            <TimelineItem
              title="The Problem We Saw"
              description="Compliance was being treated as paperwork. But in reality, it is infrastructure. Risk only surfaced when it was already too late. Teams needed a system that made compliance operational—not optional."
              icon={<Target className="h-6 w-6 text-primary" />}
              delay={0.2}
            />

            <TimelineItem
              title="The Solution We Built"
              description="We asked: What if compliance wasn't something you prepared for… but something you lived inside every day? FormaOS was designed as a true Compliance Operating System—aligning controls, evidence, tasks, governance, and accountability in one connected environment."
              icon={<Shield className="h-6 w-6 text-primary" />}
              delay={0.4}
            />
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Mission statement */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="secondary"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <MissionStatement
            statement="If systems shape behavior, then compliance systems must shape accountability."
            author="Ejaz Hussain"
            role="Chief Engineer, FormaOS"
            delay={0}
          />
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* What makes us different */}
      <CinematicSection 
        backgroundType="nodes" 
        ambientColor="accent"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="What Makes FormaOS Different"
            title={<>Not a document manager—<br /><span className="text-gradient">a command center</span></>}
            subtitle="FormaOS unifies what used to live in silos"
            alignment="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ValueProp
              icon={<Target className="h-8 w-8 text-primary" />}
              title="Operational tasks"
              description="Turn controls into assignable work with owners, deadlines, and accountability"
              delay={0}
            />
            <ValueProp
              icon={<Shield className="h-8 w-8 text-primary" />}
              title="Evidence & documentation"
              description="Store artifacts with approval chains, version control, and audit context"
              delay={0.1}
            />
            <ValueProp
              icon={<Users className="h-8 w-8 text-primary" />}
              title="Governance controls"
              description="Map frameworks to controls with posture scoring and gap analysis"
              delay={0.2}
            />
            <ValueProp
              icon={<BookOpen className="h-8 w-8 text-primary" />}
              title="Audit readiness"
              description="Generate export bundles, reports, and compliance snapshots in minutes"
              delay={0.3}
            />
            <ValueProp
              icon={<Sparkles className="h-8 w-8 text-primary" />}
              title="Executive oversight"
              description="Real-time dashboards showing posture, risk, and remediation status"
              delay={0.4}
            />
            <ValueProp
              icon={<Shield className="h-8 w-8 text-primary" />}
              title="Immutable history"
              description="Complete audit trail of every decision, approval, and change"
              delay={0.5}
            />
          </div>

          <div className="glass-panel-strong rounded-2xl p-10 mt-16 text-center">
            <p className="text-xl md:text-2xl font-semibold font-display mb-4">
              No scattered tools. No last-minute audit scrambles. No blind spots.
            </p>
            <p className="text-lg text-foreground/70">
              Just clarity, structure, and confidence.
            </p>
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Team section */}
      <CinematicSection 
        backgroundType="flow" 
        ambientColor="primary"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Leadership"
            title={<>Built for people who<br /><span className="text-gradient">carry responsibility</span></>}
            subtitle="We don't build for 'users'—we build for teams responsible for safety, compliance, outcomes, and trust"
            alignment="center"
          />

          <div className="max-w-3xl mx-auto">
            <TeamMember
              name="Ejaz Hussain"
              role="Chief Engineer, FormaOS"
              location="Adelaide, South Australia"
              bio="FormaOS is engineered with one guiding principle: If systems shape behavior, then compliance systems must shape accountability. Every feature, workflow, and control inside FormaOS exists to make regulated operations not just compliant—but resilient, transparent, and future-proof."
              delay={0}
            />
          </div>
        </div>
      </CinematicSection>

      <VisualDivider />

      {/* Commitment / Values */}
      <CinematicSection 
        backgroundType="gradient" 
        ambientColor="secondary"
        className="py-20 lg:py-32"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <NarrativeBlock
            title="Our Commitment"
            variant="emphasis"
            delay={0}
            content={
              <div className="space-y-6 text-lg text-foreground/80 leading-relaxed">
                <p>
                  We are not here to build software that looks impressive.
                </p>
                <p>
                  We are here to build infrastructure that stands up in audits, scales with complexity, 
                  and protects the people who rely on it.
                </p>
                <p className="text-2xl font-semibold text-foreground pt-4">
                  FormaOS is not just a product.
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  It is a framework for operational trust.
                </p>
              </div>
            }
          />

          <div className="grid sm:grid-cols-3 gap-6 mt-16">
            <div className="glass-panel rounded-2xl p-8 text-center">
              <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
              <div className="text-sm text-muted-foreground mb-2">Email</div>
              <div className="text-base font-medium">formaos.team@gmail.com</div>
            </div>
            <div className="glass-panel rounded-2xl p-8 text-center">
              <Phone className="h-8 w-8 text-primary mx-auto mb-4" />
              <div className="text-sm text-muted-foreground mb-2">Phone</div>
              <div className="text-base font-medium">+61 469 715 062</div>
            </div>
            <div className="glass-panel rounded-2xl p-8 text-center">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-4" />
              <div className="text-sm text-muted-foreground mb-2">Location</div>
              <div className="text-base font-medium">Adelaide, SA</div>
            </div>
          </div>
        </div>
      </CinematicSection>
    </>
  );
}
