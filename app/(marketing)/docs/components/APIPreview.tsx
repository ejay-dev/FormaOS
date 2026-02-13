'use client';

import { useState, useCallback } from 'react';
import {
  Code,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Shield,
  Clock,
  Key,
  FileText,
  ClipboardList,
  Activity,
  BarChart3,
  Zap,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { duration, easing } from '@/config/motion';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface QueryParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
}

interface Endpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  title: string;
  description: string;
  rateLimit: string;
  permission: string;
  queryParams: QueryParam[];
  curlExample: string;
  responseExample: string;
  icon: typeof Code;
  accentColor: string;
}

/* ------------------------------------------------------------------ */
/*  Endpoint data (derived from the actual route files)                */
/* ------------------------------------------------------------------ */

const endpoints: Endpoint[] = [
  {
    id: 'audit-logs',
    method: 'GET',
    path: '/api/v1/audit-logs',
    title: 'List Audit Logs',
    description:
      'Retrieve audit log entries for your organization. Returns a time-ordered list of actions, actors, and metadata for compliance tracking and investigation.',
    rateLimit: '60 requests / minute',
    permission: 'VIEW_CONTROLS',
    icon: Activity,
    accentColor: 'cyan',
    queryParams: [
      {
        name: 'action',
        type: 'string',
        required: false,
        description:
          'Filter by action type (e.g. "policy.updated", "user.login")',
      },
      {
        name: 'startDate',
        type: 'ISO 8601',
        required: false,
        description: 'Return logs created on or after this timestamp',
      },
      {
        name: 'endDate',
        type: 'ISO 8601',
        required: false,
        description: 'Return logs created on or before this timestamp',
      },
      {
        name: 'limit',
        type: 'integer',
        required: false,
        description: 'Maximum number of results (1-200)',
        default: '50',
      },
    ],
    curlExample: `curl -X GET \\
  "https://api.formaos.com/v1/audit-logs?limit=10&action=policy.updated" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: JSON.stringify(
      {
        logs: [
          {
            id: 'log_9f8e7d6c',
            action: 'policy.updated',
            target: 'policy_abc123',
            actor_email: 'admin@example.com',
            domain: 'compliance',
            severity: 'info',
            metadata: { field: 'status', from: 'draft', to: 'active' },
            created_at: '2026-02-10T14:32:00Z',
          },
        ],
        total: 1,
        limit: 10,
        filters: {
          action: 'policy.updated',
          startDate: null,
          endDate: null,
        },
      },
      null,
      2,
    ),
  },
  {
    id: 'compliance',
    method: 'GET',
    path: '/api/v1/compliance',
    title: 'Get Compliance Metrics',
    description:
      "Returns a real-time snapshot of your organization's compliance posture including overall score, risk level, policy coverage, task completion, and evidence collection rates.",
    rateLimit: '60 requests / minute',
    permission: 'VIEW_CONTROLS',
    icon: BarChart3,
    accentColor: 'emerald',
    queryParams: [],
    curlExample: `curl -X GET \\
  "https://api.formaos.com/v1/compliance" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: JSON.stringify(
      {
        organizationId: 'org_a1b2c3d4',
        complianceScore: 87.5,
        riskLevel: 'low',
        complianceTrend: 'improving',
        policies: {
          total: 24,
          active: 21,
          coverageRate: 87.5,
        },
        tasks: {
          total: 156,
          completed: 134,
          pending: 18,
          overdue: 4,
          completionRate: 85.9,
        },
        evidence: {
          collected: 89,
          required: 102,
          completionRate: 87.3,
        },
        anomalies: 2,
        lastUpdated: '2026-02-12T09:15:00Z',
      },
      null,
      2,
    ),
  },
  {
    id: 'evidence',
    method: 'GET',
    path: '/api/v1/evidence',
    title: 'List Evidence',
    description:
      'Retrieve evidence artifacts uploaded to your organization. Supports filtering by verification status and linked task to help track audit readiness.',
    rateLimit: '100 requests / minute',
    permission: 'VIEW_CONTROLS',
    icon: FileText,
    accentColor: 'blue',
    queryParams: [
      {
        name: 'status',
        type: 'string',
        required: false,
        description:
          'Filter by verification status ("pending", "verified", "rejected")',
      },
      {
        name: 'taskId',
        type: 'string',
        required: false,
        description: 'Filter evidence linked to a specific task',
      },
      {
        name: 'limit',
        type: 'integer',
        required: false,
        description: 'Maximum number of results (1-100)',
        default: '50',
      },
    ],
    curlExample: `curl -X GET \\
  "https://api.formaos.com/v1/evidence?status=verified&limit=20" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: JSON.stringify(
      {
        evidence: [
          {
            id: 'ev_x1y2z3',
            title: 'SOC 2 Access Review Q1',
            file_name: 'access-review-q1-2026.pdf',
            file_type: 'application/pdf',
            file_size: 245760,
            verification_status: 'verified',
            uploaded_by: 'user_abc123',
            verified_by: 'user_def456',
            verified_at: '2026-02-08T11:20:00Z',
            task_id: 'task_m1n2o3',
            created_at: '2026-02-05T09:00:00Z',
          },
        ],
        total: 1,
        limit: 20,
        status: 'verified',
        taskId: null,
      },
      null,
      2,
    ),
  },
  {
    id: 'tasks',
    method: 'GET',
    path: '/api/v1/tasks',
    title: 'List Tasks',
    description:
      'Retrieve compliance tasks assigned to the authenticated user. Filter by status or priority to surface the most urgent items.',
    rateLimit: '100 requests / minute',
    permission: 'VIEW_CONTROLS',
    icon: ClipboardList,
    accentColor: 'purple',
    queryParams: [
      {
        name: 'status',
        type: 'string',
        required: false,
        description:
          'Filter by task status ("open", "in_progress", "completed", "overdue")',
      },
      {
        name: 'priority',
        type: 'string',
        required: false,
        description: 'Filter by priority ("low", "medium", "high", "critical")',
      },
      {
        name: 'limit',
        type: 'integer',
        required: false,
        description: 'Maximum number of results (1-100)',
        default: '50',
      },
    ],
    curlExample: `curl -X GET \\
  "https://api.formaos.com/v1/tasks?status=open&priority=high" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json"`,
    responseExample: JSON.stringify(
      {
        tasks: [
          {
            id: 'task_m1n2o3',
            title: 'Complete Q1 access review',
            description: 'Review and certify user access for SOC 2 compliance',
            status: 'open',
            priority: 'high',
            due_date: '2026-03-01T00:00:00Z',
            assigned_to: 'user_abc123',
            created_at: '2026-01-15T10:00:00Z',
            updated_at: '2026-02-10T16:45:00Z',
          },
        ],
        total: 1,
        limit: 50,
        status: 'open',
        priority: 'high',
      },
      null,
      2,
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Error response examples                                            */
/* ------------------------------------------------------------------ */

const errorExamples = [
  {
    status: 401,
    label: 'Unauthorized',
    body: JSON.stringify(
      { error: 'Unauthorized - Bearer token required' },
      null,
      2,
    ),
  },
  {
    status: 403,
    label: 'Forbidden',
    body: JSON.stringify(
      { error: 'Forbidden - Insufficient permissions' },
      null,
      2,
    ),
  },
  {
    status: 429,
    label: 'Rate Limited',
    body: JSON.stringify(
      {
        error: 'Rate limit exceeded',
        retryAfter: '2026-02-12T09:16:00Z',
      },
      null,
      2,
    ),
  },
  {
    status: 500,
    label: 'Server Error',
    body: JSON.stringify({ error: 'Internal server error' }, null, 2),
  },
];

/* ------------------------------------------------------------------ */
/*  Reusable sub-components                                            */
/* ------------------------------------------------------------------ */

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    PATCH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold font-mono border ${colors[method] || colors.GET}`}
    >
      {method}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all bg-gray-800/60 border border-gray-700/50 hover:border-cyan-500/40 hover:bg-gray-800 text-gray-400 hover:text-cyan-400"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function CodeBlock({
  code,
  filename,
  language,
}: {
  code: string;
  filename: string;
  language: string;
}) {
  return (
    <div className="rounded-xl bg-gray-950/80 border border-gray-800/50 overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900/60 border-b border-gray-800/50">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <span className="text-xs text-gray-500 font-mono">{filename}</span>
          <span className="text-[10px] text-gray-600 font-mono uppercase tracking-wider ml-1">
            {language}
          </span>
        </div>
        <CopyButton text={code} />
      </div>
      {/* Code */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-[13px] leading-relaxed font-mono">
          <code className="text-gray-300 whitespace-pre">{code}</code>
        </pre>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Endpoint card                                                      */
/* ------------------------------------------------------------------ */

function EndpointCard({
  endpoint,
  index,
}: {
  endpoint: Endpoint;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(index === 0);
  const Icon = endpoint.icon;
  const panelId = `${endpoint.id}-details`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: duration.slow, delay: index * 0.1 }}
      className="relative rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-950/50 backdrop-blur-xl border border-white/5 overflow-hidden shadow-xl shadow-black/20"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

      {/* Header - always visible, acts as toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-center gap-4 p-6 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center">
          <Icon className="w-5 h-5 text-cyan-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <MethodBadge method={endpoint.method} />
            <code className="text-sm font-mono text-gray-300 truncate">
              {endpoint.path}
            </code>
          </div>
          <h3 className="text-lg font-semibold text-white">{endpoint.title}</h3>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            {endpoint.rateLimit}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-gray-500" />
          </motion.div>
        </div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [...easing.smooth] }}
            id={panelId}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-6 border-t border-gray-800/50 pt-6">
              {/* Description */}
              <p className="text-gray-400 leading-relaxed">
                {endpoint.description}
              </p>

              {/* Meta badges */}
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Shield className="w-3.5 h-3.5" />
                  {endpoint.permission}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5" />
                  {endpoint.rateLimit}
                </span>
              </div>

              {/* Query Parameters */}
              {endpoint.queryParams.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-cyan-400" />
                    Query Parameters
                  </h4>
                  <div className="rounded-xl border border-gray-800/50 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-900/60 border-b border-gray-800/50">
                          <th className="text-left px-4 py-2.5 text-gray-400 font-medium text-xs uppercase tracking-wider">
                            Parameter
                          </th>
                          <th className="text-left px-4 py-2.5 text-gray-400 font-medium text-xs uppercase tracking-wider">
                            Type
                          </th>
                          <th className="text-left px-4 py-2.5 text-gray-400 font-medium text-xs uppercase tracking-wider hidden md:table-cell">
                            Required
                          </th>
                          <th className="text-left px-4 py-2.5 text-gray-400 font-medium text-xs uppercase tracking-wider">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {endpoint.queryParams.map((param, i) => (
                          <tr
                            key={param.name}
                            className={
                              i !== endpoint.queryParams.length - 1
                                ? 'border-b border-gray-800/30'
                                : ''
                            }
                          >
                            <td className="px-4 py-3">
                              <code className="text-cyan-400 text-xs font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded">
                                {param.name}
                              </code>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                              {param.type}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              {param.required ? (
                                <span className="text-amber-400 text-xs">
                                  Required
                                </span>
                              ) : (
                                <span className="text-gray-600 text-xs">
                                  Optional
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {param.description}
                              {param.default && (
                                <span className="text-gray-600 ml-1">
                                  (default: {param.default})
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Request example */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                  Request Example
                </h4>
                <CodeBlock
                  code={endpoint.curlExample}
                  filename="request.sh"
                  language="bash"
                />
              </div>

              {/* Response example */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                  Response{' '}
                  <span className="text-emerald-400 text-xs font-mono">
                    200 OK
                  </span>
                </h4>
                <CodeBlock
                  code={endpoint.responseExample}
                  filename="response.json"
                  language="json"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main API Reference component                                       */
/* ------------------------------------------------------------------ */

export function APIPreview() {
  return (
    <section
      id="api-reference"
      className="relative py-24 bg-gradient-to-b from-[#0d1421] to-[#0a0f1c]"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 -left-32 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3,
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 lg:px-12">
        {/* -------- Section header -------- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6 backdrop-blur-sm">
            <Code className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-400 font-medium tracking-wide">
              REST API v1
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            API{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Reference
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Programmatic access to audit logs, compliance metrics, evidence, and
            tasks. All endpoints return JSON and require Bearer token
            authentication.
          </p>
        </motion.div>

        {/* -------- Authentication card -------- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow }}
          className="mb-8 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-950/50 backdrop-blur-xl border border-white/5 p-6 lg:p-8 shadow-xl shadow-black/20"
        >
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                Authentication
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                All API requests require a valid Bearer token in the{' '}
                <code className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded text-xs font-mono">
                  Authorization
                </code>{' '}
                header. Tokens are issued as Supabase JWTs when a user
                authenticates. Include the token with every request.
              </p>
            </div>
          </div>

          <CodeBlock
            code={`# Include your Bearer token in every request
curl -X GET "https://api.formaos.com/v1/compliance" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \\
  -H "Content-Type: application/json"`}
            filename="auth-example.sh"
            language="bash"
          />
        </motion.div>

        {/* -------- Rate limiting + Base URL info -------- */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-950/50 backdrop-blur-xl border border-white/5 p-6 shadow-xl shadow-black/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <Zap className="w-4 h-4 text-orange-400" />
              </div>
              <h4 className="font-semibold text-white">Rate Limiting</h4>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-3">
              Requests are rate-limited per endpoint. Exceeding the limit
              returns a{' '}
              <code className="text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded text-xs font-mono">
                429
              </code>{' '}
              status with a{' '}
              <code className="text-gray-300 bg-gray-800/80 px-1.5 py-0.5 rounded text-xs font-mono">
                retryAfter
              </code>{' '}
              timestamp.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-mono">
                  /audit-logs, /compliance
                </span>
                <span className="text-amber-400 font-medium">60 req/min</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-mono">
                  /evidence, /tasks
                </span>
                <span className="text-emerald-400 font-medium">
                  100 req/min
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-950/50 backdrop-blur-xl border border-white/5 p-6 shadow-xl shadow-black/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                <Lock className="w-4 h-4 text-cyan-400" />
              </div>
              <h4 className="font-semibold text-white">
                Base URL &amp; Security
              </h4>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-3">
              All endpoints are served over HTTPS at the base URL below.
              Requests over plain HTTP are rejected.
            </p>
            <div className="rounded-lg bg-gray-950/60 border border-gray-800/50 px-4 py-3">
              <code className="text-cyan-400 text-sm font-mono">
                https://api.formaos.com/v1
              </code>
            </div>
          </motion.div>
        </div>

        {/* -------- Endpoint cards -------- */}
        <div className="space-y-4 mb-12">
          {endpoints.map((ep, i) => (
            <EndpointCard key={ep.id} endpoint={ep} index={i} />
          ))}
        </div>

        {/* -------- Error responses -------- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slow }}
          className="rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-950/50 backdrop-blur-xl border border-white/5 p-6 lg:p-8 shadow-xl shadow-black/20"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                Error Responses
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                All errors return a JSON object with an{' '}
                <code className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded text-xs font-mono">
                  error
                </code>{' '}
                field describing the issue. Use the HTTP status code to
                determine the category.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {errorExamples.map((err) => (
              <div
                key={err.status}
                className="rounded-xl bg-gray-950/60 border border-gray-800/40 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${
                      err.status === 429
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : err.status >= 500
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {err.status}
                  </span>
                  <span className="text-sm text-gray-400 font-medium">
                    {err.label}
                  </span>
                </div>
                <pre className="text-xs font-mono text-gray-500 whitespace-pre overflow-x-auto">
                  {err.body}
                </pre>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
