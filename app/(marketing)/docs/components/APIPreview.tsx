'use client';

import { ArrowRight, Code, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function APIPreview() {
  return (
    <section className="relative py-16 bg-gradient-to-b from-[#0d1421] to-[#0a0f1c]">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative p-8 lg:p-12 rounded-3xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/30 overflow-hidden"
        >
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
            <div className="w-full lg:w-1/2">
              <div className="rounded-xl bg-gray-950/80 border border-gray-800/50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/50 border-b border-gray-800/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <span className="text-xs text-gray-500 ml-2 font-mono">api-example.sh</span>
                </div>
                <pre className="p-4 text-sm font-mono overflow-x-auto">
                  <code className="text-gray-300">
                    <span className="text-cyan-400">curl</span>{' '}
                    <span className="text-yellow-400">-X GET</span>{' '}
                    <span className="text-gray-500">\</span>
                    {'\n'}{'  '}
                    <span className="text-emerald-400">&quot;https://api.formaos.com/v1/workflows&quot;</span>{' '}
                    <span className="text-gray-500">\</span>
                    {'\n'}{'  '}
                    <span className="text-purple-400">-H</span>{' '}
                    <span className="text-emerald-400">&quot;Authorization: Bearer $API_KEY&quot;</span>{' '}
                    <span className="text-gray-500">\</span>
                    {'\n'}{'  '}
                    <span className="text-purple-400">-H</span>{' '}
                    <span className="text-emerald-400">&quot;Content-Type: application/json&quot;</span>
                  </code>
                </pre>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                <Code className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-400 font-medium">Developer API</span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                Build Powerful Integrations with the FormaOS API
              </h2>

              <p className="text-gray-400 leading-relaxed">
                Our comprehensive REST API gives you programmatic access to
                workflows, evidence, audit trails, and compliance data. Build
                custom integrations, automate processes, and extend FormaOS to
                fit your needs.
              </p>

              <ul className="space-y-3">
                {[
                  'RESTful endpoints with JSON responses',
                  'Webhook support for real-time events',
                  'OAuth 2.0 and API key authentication',
                  'Comprehensive documentation & SDKs',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <motion.a
                href="#integrations"
                whileHover={{ x: 5 }}
                className="inline-flex items-center gap-2 text-cyan-400 font-medium group"
              >
                <span>Explore API Documentation</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
