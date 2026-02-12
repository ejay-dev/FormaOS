'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Shield,
  Link2,
  Clock,
  CheckCircle,
  Copy,
  ExternalLink,
  FileText,
  Lock,
} from 'lucide-react';

/**
 * =========================================================
 * TRUST PACKET GENERATOR
 * =========================================================
 *
 * In-app component that generates a secure, time-limited
 * trust packet link for sharing compliance posture with
 * enterprise buyers, auditors, or procurement teams.
 *
 * Reduces sales friction by enabling self-service due diligence.
 */

interface TrustPacketData {
  security_overview: {
    role_based_access: boolean;
    audit_logging: boolean;
    encryption_at_rest: boolean;
    encryption_in_transit: boolean;
    sso_available: boolean;
    mfa_available: boolean;
  };
  compliance_summary: {
    frameworks_enabled: number;
    active_policies: number;
    total_controls: number;
    implemented_controls: number;
    coverage_percent: number;
  };
  frameworks: Array<{
    key: string;
    status: string;
    enabled_at: string;
  }>;
}

interface GenerateResult {
  success: boolean;
  shareUrl: string | null;
  expiresAt: string;
  packet: TrustPacketData;
  warning?: string;
}

export function TrustPacketGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(7);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/trust-packet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate trust packet');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate trust packet',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.shareUrl) return;
    await navigator.clipboard.writeText(result.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (result) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
            <CardTitle>Trust Packet Generated</CardTitle>
          </div>
          <CardDescription>
            Share this secure link with auditors or enterprise buyers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Share URL */}
          {result.shareUrl && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <Link2
                className="h-4 w-4 text-muted-foreground shrink-0"
                aria-hidden="true"
              />
              <code className="text-sm text-foreground truncate flex-1">
                {result.shareUrl}
              </code>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCopy}
                aria-label="Copy link"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {result.warning && (
            <p className="text-xs text-warning bg-warning/10 rounded-lg px-3 py-2">
              {result.warning}
            </p>
          )}

          {/* Expiry */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>
              Expires{' '}
              {new Date(result.expiresAt).toLocaleDateString('en-AU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Frameworks"
              value={result.packet.compliance_summary.frameworks_enabled}
              icon={Shield}
            />
            <StatCard
              label="Controls Coverage"
              value={`${result.packet.compliance_summary.coverage_percent}%`}
              icon={CheckCircle}
            />
            <StatCard
              label="Active Policies"
              value={result.packet.compliance_summary.active_policies}
              icon={FileText}
            />
            <StatCard
              label="Security Controls"
              value={
                Object.values(result.packet.security_overview).filter(Boolean)
                  .length
              }
              icon={Lock}
            />
          </div>
        </CardContent>
        <CardFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setResult(null);
              setError(null);
            }}
          >
            Generate New
          </Button>
          {result.shareUrl && (
            <Button asChild>
              <a
                href={result.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Preview <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle>Generate Trust Packet</CardTitle>
        </div>
        <CardDescription>
          Create a secure, time-limited link containing your compliance posture,
          security overview, framework coverage, and active policies. Share with
          enterprise buyers or auditors to accelerate procurement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Expiry selector */}
        <div>
          <label
            htmlFor="expires-select"
            className="text-sm font-medium text-foreground"
          >
            Link expiry
          </label>
          <select
            id="expires-select"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(Number(e.target.value))}
            className="mt-1 block w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
          >
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>

        {/* What's included */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            What&apos;s included
          </p>
          <ul className="space-y-1.5">
            {[
              'Security architecture overview',
              'Compliance framework mappings',
              'Active policies summary',
              'Control coverage statistics',
              'Risk posture indicators',
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle
                  className="h-3.5 w-3.5 text-success shrink-0"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerate} loading={isGenerating}>
          Generate Trust Packet
        </Button>
      </CardFooter>
    </Card>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <div>
        <p className="text-lg font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
