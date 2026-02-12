'use client';

import { CheckCircle, Building2, Zap, Eye, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const models = [
  {
    number: '1', title: 'Structure', subtitle: 'Model your organization with governance built in',
    description: 'Model your organization, teams, sites, and responsibilities with clarity and governance built in.',
    features: ['Organizational hierarchy and role mapping', 'Framework-aligned policy and control architecture', 'Clear accountability for every obligation', 'Evidence chains mapped to controls'],
    outcome: 'Your compliance foundation becomes structured, governed, and audit-ready by design.',
    color: 'from-cyan-500 to-blue-500', icon: Building2,
  },
  {
    number: '2', title: 'Operationalize', subtitle: 'Turn requirements into real execution',
    description: 'Turn requirements into real, trackable execution across teams.',
    features: ['5 workflow triggers: evidence expiry, control failures, task overdue, cert expiring, progress notes due', 'Healthcare workflows: Progress notes auto-generate compliance evidence, incidents auto-map to controls', 'Patient/participant tracking: All care updates linked to compliance controls automatically', 'Conditional task generation with priority, owners, and due dates', 'Auto-escalation rules for critical issues', 'Notification routing and audit trail logging'],
    outcome: 'Compliance becomes part of daily operations. Patient care and regulatory evidence happen together, not separately.',
    color: 'from-blue-500 to-purple-500', icon: Zap,
  },
  {
    number: '3', title: 'Validate', subtitle: 'Continuously verify controls are working',
    description: 'Continuously verify that controls are working as intended.',
    features: ['Real-time compliance monitoring', 'Automated deviation alerts', 'Control effectiveness tracking', 'Live risk and status visibility'],
    outcome: "You don't wait for audits to discover issues. You see them as they happen.",
    color: 'from-purple-500 to-pink-500', icon: Eye,
  },
  {
    number: '4', title: 'Defend', subtitle: 'Produce audit-ready evidence instantly',
    description: 'Produce audit-ready evidence with full traceability and regulatory context.',
    features: ['Immutable evidence chains', 'Time-stamped audit logs', 'Regulatory reporting packages', 'Defensible audit trails and documentation'],
    outcome: 'Audits become confirmations, not investigations.',
    color: 'from-pink-500 to-rose-500', icon: Shield,
  },
];

export function OperatingModel() {
  return (
    <section className="relative py-32 overflow-hidden">
      <motion.div
        className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-l from-cyan-500/10 to-transparent rounded-full blur-3xl"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            The FormaOS Operating Model
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
            Four Phases.
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              {' '}Complete Control.
            </span>
          </h2>
        </motion.div>

        <div className="space-y-8">
          {models.map((model, index) => {
            const Icon = model.icon;
            return (
              <motion.div
                key={model.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.1 }}
                className="group"
              >
                <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 hover:border-cyan-500/30 transition-all overflow-hidden">
                  <div className="grid lg:grid-cols-[300px_1fr] gap-8 p-8 sm:p-10">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${model.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div className={`text-sm font-semibold bg-gradient-to-r ${model.color} bg-clip-text text-transparent`}>
                            Phase {model.number}
                          </div>
                          <h3 className="text-2xl font-bold text-white">{model.title}</h3>
                        </div>
                      </div>
                      <p className="text-gray-400 leading-relaxed">{model.description}</p>
                    </div>
                    <div>
                      <div className="grid sm:grid-cols-2 gap-3 mb-6">
                        {model.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      <div className={`inline-block px-4 py-2 rounded-lg bg-gradient-to-r ${model.color} bg-opacity-10 border border-white/10`}>
                        <p className="text-sm text-white font-medium">{model.outcome}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
