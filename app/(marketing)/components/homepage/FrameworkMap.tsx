'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

interface Framework {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  controlCount: number;
  controls: { name: string; status: 'mapped' | 'partial' }[];
  scope: string;
}

const FRAMEWORKS: Framework[] = [
  {
    id: 'iso27001',
    label: 'ISO 27001',
    color: '#3b82f6',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'International standard for information security management systems. Covers risk assessment, asset management, access control, cryptography, and incident management.',
    controlCount: 114,
    scope: 'Information Security',
    controls: [
      { name: 'Access Control', status: 'mapped' },
      { name: 'Data Protection', status: 'mapped' },
      { name: 'Incident Response', status: 'mapped' },
      { name: 'Risk Management', status: 'mapped' },
      { name: 'Audit Logging', status: 'mapped' },
      { name: 'Vendor Management', status: 'mapped' },
    ],
  },
  {
    id: 'soc2',
    label: 'SOC 2',
    color: '#06b6d4',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    description: 'AICPA trust services criteria for service organisations. Covers security, availability, processing integrity, confidentiality, and privacy.',
    controlCount: 64,
    scope: 'Trust Services',
    controls: [
      { name: 'Access Control', status: 'mapped' },
      { name: 'Data Protection', status: 'mapped' },
      { name: 'Incident Response', status: 'mapped' },
      { name: 'Audit Logging', status: 'mapped' },
      { name: 'Risk Management', status: 'partial' },
      { name: 'Vendor Management', status: 'partial' },
    ],
  },
  {
    id: 'hipaa',
    label: 'HIPAA',
    color: '#a855f7',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'US regulation for protecting patient health information. Covers administrative, physical, and technical safeguards for protected health information (PHI).',
    controlCount: 78,
    scope: 'Healthcare',
    controls: [
      { name: 'Access Control', status: 'mapped' },
      { name: 'Data Protection', status: 'mapped' },
      { name: 'Incident Response', status: 'mapped' },
      { name: 'Audit Logging', status: 'mapped' },
      { name: 'Risk Management', status: 'partial' },
      { name: 'Vendor Management', status: 'partial' },
    ],
  },
  {
    id: 'ndis',
    label: 'NDIS',
    color: '#22c55e',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    description: 'Australian National Disability Insurance Scheme quality and safeguards standards. Covers worker screening, incident management, complaints, and service delivery.',
    controlCount: 45,
    scope: 'Disability Services',
    controls: [
      { name: 'Access Control', status: 'mapped' },
      { name: 'Incident Response', status: 'mapped' },
      { name: 'Risk Management', status: 'mapped' },
      { name: 'Vendor Management', status: 'mapped' },
      { name: 'Data Protection', status: 'partial' },
      { name: 'Audit Logging', status: 'partial' },
    ],
  },
  {
    id: 'pcidss',
    label: 'PCI-DSS',
    color: '#f59e0b',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Payment Card Industry Data Security Standard. Covers network security, cardholder data protection, vulnerability management, and access control.',
    controlCount: 89,
    scope: 'Payment Security',
    controls: [
      { name: 'Access Control', status: 'mapped' },
      { name: 'Data Protection', status: 'mapped' },
      { name: 'Risk Management', status: 'mapped' },
      { name: 'Audit Logging', status: 'mapped' },
      { name: 'Vendor Management', status: 'mapped' },
      { name: 'Incident Response', status: 'partial' },
    ],
  },
  {
    id: 'nistcsf',
    label: 'NIST CSF',
    color: '#f43f5e',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    description: 'NIST Cybersecurity Framework for critical infrastructure. Covers identify, protect, detect, respond, and recover functions across cybersecurity risk.',
    controlCount: 108,
    scope: 'Cybersecurity',
    controls: [
      { name: 'Incident Response', status: 'mapped' },
      { name: 'Risk Management', status: 'mapped' },
      { name: 'Access Control', status: 'mapped' },
      { name: 'Data Protection', status: 'mapped' },
      { name: 'Vendor Management', status: 'mapped' },
      { name: 'Audit Logging', status: 'partial' },
    ],
  },
];

const ALL_TAB = { id: 'all', label: 'All Frameworks' };

// ─── All-frameworks grid ───────────────────────────────────────────────────────

function AllFrameworksGrid({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {FRAMEWORKS.map((fw) => (
        <button
          key={fw.id}
          onClick={() => onSelect(fw.id)}
          className={`text-left p-5 rounded-2xl border ${fw.borderColor} ${fw.bgColor} hover:bg-white/5 transition-all duration-200 group`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: fw.color }} />
              <span className="font-bold text-white text-base">{fw.label}</span>
            </div>
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
              {fw.scope}
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">
            {fw.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: fw.color }}>
              {fw.controlCount} controls mapped
            </span>
            <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
              View details →
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Single framework detail ───────────────────────────────────────────────────

function FrameworkDetail({ fw }: { fw: Framework }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-6 rounded-2xl border ${fw.borderColor} ${fw.bgColor}`}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: fw.color }} />
            <h3 className="text-2xl font-bold text-white">{fw.label}</h3>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-black text-white">{fw.controlCount}</div>
            <div className="text-xs text-gray-400">controls mapped</div>
          </div>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{fw.description}</p>
        <div className="mt-3">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
            Scope: {fw.scope}
          </span>
        </div>
      </div>

      {/* Control mapping */}
      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
          Control Domain Coverage
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {fw.controls.map((ctrl) => (
            <div
              key={ctrl.name}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5"
            >
              <CheckCircle2
                className="w-4 h-4 flex-shrink-0"
                style={{ color: ctrl.status === 'mapped' ? '#10b981' : '#f59e0b' }}
              />
              <span className="text-sm text-gray-200">{ctrl.name}</span>
              <span className={`ml-auto text-xs font-medium ${ctrl.status === 'mapped' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {ctrl.status === 'mapped' ? 'Full' : 'Partial'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Coverage bar */}
      <div className="p-4 rounded-xl bg-white/3 border border-white/5">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>FormaOS Coverage</span>
          <span style={{ color: fw.color }}>
            {Math.round((fw.controls.filter(c => c.status === 'mapped').length / fw.controls.length) * 100)}% full mapping
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.round((fw.controls.filter(c => c.status === 'mapped').length / fw.controls.length) * 100)}%`,
              background: fw.color,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FrameworkMap() {
  const [activeTab, setActiveTab] = useState('all');

  const activeFramework = FRAMEWORKS.find((f) => f.id === activeTab) ?? null;

  return (
    <section className="mk-section relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Heading */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            6 Frameworks • 200+ Controls
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Compliance Framework{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Coverage
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            See how FormaOS maps to every major compliance framework
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
              activeTab === 'all'
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200'
            }`}
          >
            All Frameworks
          </button>
          {FRAMEWORKS.map((fw) => (
            <button
              key={fw.id}
              onClick={() => setActiveTab(fw.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                activeTab === fw.id
                  ? 'border-opacity-50 text-white'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200'
              }`}
              style={activeTab === fw.id ? {
                background: `${fw.color}20`,
                borderColor: `${fw.color}50`,
                color: fw.color,
              } : {}}
            >
              {fw.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          {activeTab === 'all' ? (
            <AllFrameworksGrid onSelect={setActiveTab} />
          ) : activeFramework ? (
            <FrameworkDetail fw={activeFramework} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default FrameworkMap;
