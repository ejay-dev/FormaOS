import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au';
const BASE = APP_URL.replace(/\/$/, '');

// Shared styles
const main = {
  backgroundColor: '#0f172a',
  fontFamily: 'Inter,-apple-system,BlinkMacSystemFont,sans-serif',
};
const container = {
  margin: '0 auto',
  maxWidth: '600px',
  backgroundColor: '#1e293b',
  borderRadius: '12px',
  overflow: 'hidden' as const,
};
const header = {
  padding: '32px 40px',
  textAlign: 'center' as const,
  background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
  borderBottom: '1px solid rgba(34,211,238,0.2)',
};
const logo = {
  color: '#22d3ee',
  fontSize: '28px',
  fontWeight: 800,
  letterSpacing: '-0.5px',
  margin: 0,
};
const tagline = {
  color: '#94a3b8',
  fontSize: '12px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  marginTop: '6px',
};
const content = { padding: '36px 40px' };
const h2 = {
  color: '#f1f5f9',
  fontSize: '22px',
  lineHeight: 1.3,
  marginBottom: '16px',
};
const text = { color: '#94a3b8', fontSize: '15px', lineHeight: 1.7 };
const cta = {
  display: 'inline-block',
  padding: '14px 32px',
  backgroundColor: '#22d3ee',
  borderRadius: '8px',
  color: '#0f172a',
  fontSize: '15px',
  fontWeight: 700,
  textDecoration: 'none',
};
const ctaDanger = { ...cta, backgroundColor: '#f87171', color: '#ffffff' };
const ctaWarn = { ...cta, backgroundColor: '#fb923c', color: '#0f172a' };
const footer = {
  color: '#475569',
  fontSize: '13px',
  fontStyle: 'italic' as const,
  margin: 0,
};
const statBox = {
  background: '#0f172a',
  border: '1px solid rgba(34,211,238,0.15)',
  borderRadius: '10px',
  padding: '16px 20px',
  margin: '20px 0',
};
const statRow = { color: '#e2e8f0', fontSize: '14px', margin: '4px 0' };
const cyan = { color: '#22d3ee' };

// ============================================================
// 1. Trial Welcome Email
// ============================================================
interface TrialWelcomeProps {
  userName?: string;
  industry?: string;
  trialDaysRemaining?: number;
}

export function TrialWelcomeEmail({
  userName = 'there',
  industry = 'your industry',
  trialDaysRemaining = 14,
}: TrialWelcomeProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to FormaOS — here&apos;s how to get started</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>
          <Section style={content}>
            <Heading style={h2}>Welcome to FormaOS, {userName}!</Heading>
            <Text style={text}>
              You&apos;re set up for <strong style={cyan}>{industry}</strong>{' '}
              compliance. Here&apos;s how to get started:
            </Text>
            <Section style={statBox}>
              <Text style={statRow}>
                <strong style={cyan}>1.</strong> Activate your first framework
              </Text>
              <Text style={statRow}>
                <strong style={cyan}>2.</strong> Create your first obligation
              </Text>
              <Text style={statRow}>
                <strong style={cyan}>3.</strong> Invite your team
              </Text>
            </Section>
            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button href={`${BASE}/app`} style={cta}>
                Go to FormaOS →
              </Button>
            </Section>
            <Text style={{ ...text, fontSize: '13px', color: '#64748b' }}>
              {trialDaysRemaining} days remaining in your trial
            </Text>
            <Hr
              style={{ borderColor: 'rgba(34,211,238,0.1)', margin: '24px 0' }}
            />
            <Text style={footer}>
              PS: Questions? Reply to this email. — The FormaOS Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================
// 2. Day 3 Activation Nudge
// ============================================================
interface ActivationNudgeProps {
  userName?: string;
  industry?: string;
}

export function ActivationNudgeEmail({
  userName = 'there',
  industry = 'your industry',
}: ActivationNudgeProps) {
  return (
    <Html>
      <Head />
      <Preview>You haven&apos;t activated a framework yet</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>
          <Section style={content}>
            <Heading style={h2}>
              Your compliance journey starts with a framework
            </Heading>
            <Text style={text}>
              Hi {userName}, your compliance journey starts with activating a
              framework.
            </Text>
            <Text style={text}>
              We have pre-built frameworks for{' '}
              <strong style={cyan}>{industry}</strong> ready to go. Takes less
              than 2 minutes.
            </Text>
            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button href={`${BASE}/app`} style={cta}>
                Activate {industry} Framework →
              </Button>
            </Section>
            <Hr
              style={{ borderColor: 'rgba(34,211,238,0.1)', margin: '24px 0' }}
            />
            <Text style={footer}>— The FormaOS Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================
// 3. Day 7 Progress Email
// ============================================================
interface ProgressEmailProps {
  userName?: string;
  obligationsCreated?: number;
  tasksCompleted?: number;
  teamMembers?: number;
  complianceScore?: number;
}

export function Day7ProgressEmail({
  userName: _userName = 'there',
  obligationsCreated = 0,
  tasksCompleted = 0,
  teamMembers = 1,
  complianceScore = 0,
}: ProgressEmailProps) {
  const hasProgress = complianceScore > 0;
  return (
    <Html>
      <Head />
      <Preview>Week 1 with FormaOS — here&apos;s your progress</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>
          <Section style={content}>
            <Heading style={h2}>
              {hasProgress
                ? 'Great progress this week!'
                : "Let's get you started"}
            </Heading>
            <Section style={statBox}>
              <Text style={statRow}>
                Obligations created:{' '}
                <strong style={cyan}>{obligationsCreated}</strong>
              </Text>
              <Text style={statRow}>
                Tasks completed: <strong style={cyan}>{tasksCompleted}</strong>
              </Text>
              <Text style={statRow}>
                Team members: <strong style={cyan}>{teamMembers}</strong>
              </Text>
              <Text style={statRow}>
                Compliance score:{' '}
                <strong style={cyan}>{complianceScore}%</strong>
              </Text>
            </Section>
            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button href={`${BASE}/app`} style={cta}>
                Continue Building Your Compliance Posture →
              </Button>
            </Section>
            <Hr
              style={{ borderColor: 'rgba(34,211,238,0.1)', margin: '24px 0' }}
            />
            <Text style={footer}>— The FormaOS Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================
// 4. Trial Expiring — Day 11 Warning
// ============================================================
interface TrialExpiringProps {
  userName?: string;
  daysRemaining?: number;
  obligationsCreated?: number;
  evidenceItems?: number;
}

export function TrialExpiringEmail({
  userName: _userName = 'there',
  daysRemaining = 3,
  obligationsCreated = 0,
  evidenceItems = 0,
}: TrialExpiringProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Your FormaOS trial ends in ${daysRemaining} days`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>
          <Section style={content}>
            <Heading style={h2}>
              Your trial ends in {daysRemaining} days
            </Heading>
            <Text style={text}>
              You&apos;ve built{' '}
              <strong style={cyan}>{obligationsCreated} obligations</strong> and
              collected{' '}
              <strong style={cyan}>{evidenceItems} evidence items</strong>.
              Upgrade to keep everything.
            </Text>
            <Section style={statBox}>
              <Text style={statRow}>Starter — $159/mo</Text>
              <Text style={statRow}>Professional — $239/mo</Text>
              <Text style={statRow}>Enterprise — $399/mo</Text>
            </Section>
            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button href={`${BASE}/app/billing`} style={cta}>
                Upgrade Now →
              </Button>
            </Section>
            <Hr
              style={{ borderColor: 'rgba(34,211,238,0.1)', margin: '24px 0' }}
            />
            <Text style={footer}>— The FormaOS Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================
// 5. Trial Expiring — Day 13 Final Warning
// ============================================================
interface TrialFinalWarningProps {
  userName?: string;
  obligationsCreated?: number;
  evidenceItems?: number;
  teamMembers?: number;
}

export function TrialFinalWarningEmail({
  userName: _userName = 'there',
  obligationsCreated = 0,
  evidenceItems = 0,
  teamMembers = 1,
}: TrialFinalWarningProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Last day of your FormaOS trial — don&apos;t lose your work
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>
          <Section style={content}>
            <Heading style={{ ...h2, color: '#fb923c' }}>
              ⚠️ Tomorrow your trial expires
            </Heading>
            <Section style={statBox}>
              <Text style={statRow}>{obligationsCreated} obligations</Text>
              <Text style={statRow}>{evidenceItems} evidence items</Text>
              <Text style={statRow}>{teamMembers} team members</Text>
            </Section>
            <Text style={text}>
              All your data is preserved when you upgrade.
            </Text>
            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button href={`${BASE}/app/billing`} style={ctaWarn}>
                Upgrade Before Midnight →
              </Button>
            </Section>
            <Hr
              style={{ borderColor: 'rgba(34,211,238,0.1)', margin: '24px 0' }}
            />
            <Text style={footer}>— The FormaOS Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================
// 6. Trial Expired
// ============================================================
export function TrialExpiredEmail({
  userName = 'there',
}: {
  userName?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Your FormaOS trial has ended</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>
          <Section style={content}>
            <Heading style={h2}>Your trial has ended</Heading>
            <Text style={text}>
              Hi {userName}, your trial has ended but{' '}
              <strong style={cyan}>your data is safe</strong>. We keep it for 30
              days.
            </Text>
            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button href={`${BASE}/app/billing`} style={cta}>
                Reactivate FormaOS →
              </Button>
            </Section>
            <Hr
              style={{ borderColor: 'rgba(34,211,238,0.1)', margin: '24px 0' }}
            />
            <Text style={footer}>— The FormaOS Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================
// 7. Payment Failed
// ============================================================
interface PaymentFailedProps {
  userName?: string;
  amount?: string;
  cardLast4?: string;
}

export function PaymentFailedEmail({
  userName: _userName = 'there',
  amount = '$0.00',
  cardLast4 = '****',
}: PaymentFailedProps) {
  return (
    <Html>
      <Head />
      <Preview>Action required — FormaOS payment failed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>
          <Section style={content}>
            <Heading style={{ ...h2, color: '#f87171' }}>
              ⚠️ Payment failed
            </Heading>
            <Section style={statBox}>
              <Text style={statRow}>
                Card ending in: <strong>{cardLast4}</strong>
              </Text>
              <Text style={statRow}>
                Amount: <strong>{amount}</strong>
              </Text>
            </Section>
            <Text style={text}>
              You have <strong style={{ color: '#f1f5f9' }}>3 days</strong>{' '}
              before access is restricted.
            </Text>
            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button href={`${BASE}/app/billing`} style={ctaDanger}>
                Update Payment Method →
              </Button>
            </Section>
            <Hr
              style={{ borderColor: 'rgba(34,211,238,0.1)', margin: '24px 0' }}
            />
            <Text style={footer}>— The FormaOS Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================
// 8. Payment Recovered
// ============================================================
export function PaymentRecoveredEmail({
  userName: _userName = 'there',
}: {
  userName?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Payment successful — FormaOS access restored</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>
          <Section style={content}>
            <Heading style={h2}>✅ Payment successful</Heading>
            <Text style={text}>
              Your payment was successfully processed. Full access to FormaOS
              has been restored.
            </Text>
            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button href={`${BASE}/app`} style={cta}>
                Continue Using FormaOS →
              </Button>
            </Section>
            <Hr
              style={{ borderColor: 'rgba(34,211,238,0.1)', margin: '24px 0' }}
            />
            <Text style={footer}>— The FormaOS Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================
// 9. Plan Upgraded
// ============================================================
interface PlanUpgradedProps {
  userName?: string;
  planName?: string;
  features?: string[];
}

export function PlanUpgradedEmail({
  userName: _userName = 'there',
  planName = 'Professional',
  features = [
    'Advanced reporting',
    'Governance controls',
    'Workflow automation',
  ],
}: PlanUpgradedProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to FormaOS {planName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>
          <Section style={content}>
            <Heading style={h2}>Welcome to FormaOS {planName}! 🎉</Heading>
            <Text style={text}>
              Your plan is now <strong style={cyan}>{planName}</strong>. New
              features unlocked:
            </Text>
            <Section style={statBox}>
              {features.map((f, i) => (
                <Text key={i} style={statRow}>
                  <span style={cyan}>✓</span> {f}
                </Text>
              ))}
            </Section>
            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button href={`${BASE}/app`} style={cta}>
                Explore Your New Features →
              </Button>
            </Section>
            <Hr
              style={{ borderColor: 'rgba(34,211,238,0.1)', margin: '24px 0' }}
            />
            <Text style={footer}>— The FormaOS Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================
// 10. Plan Downgraded
// ============================================================
interface PlanDowngradedProps {
  userName?: string;
  planName?: string;
}

export function PlanDowngradedEmail({
  userName: _userName = 'there',
  planName = 'Starter',
}: PlanDowngradedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your FormaOS plan has been updated</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>
          <Section style={content}>
            <Heading style={h2}>Your plan has been updated</Heading>
            <Text style={text}>
              Your FormaOS plan is now <strong style={cyan}>{planName}</strong>.
              Your data is all still there.
            </Text>
            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button href={`${BASE}/app/billing`} style={cta}>
                View Your Current Plan →
              </Button>
            </Section>
            <Hr
              style={{ borderColor: 'rgba(34,211,238,0.1)', margin: '24px 0' }}
            />
            <Text style={footer}>— The FormaOS Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================
// 11. Subscription Cancelled
// ============================================================
export function SubscriptionCancelledEmail({
  userName: _userName = 'there',
}: {
  userName?: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>We&apos;re sorry to see you go</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>
          <Section style={content}>
            <Heading style={h2}>We&apos;re sorry to see you go</Heading>
            <Text style={text}>
              Your subscription has been cancelled. Your data is kept for{' '}
              <strong style={cyan}>30 days</strong>.
            </Text>
            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button href={`${BASE}/app/billing`} style={cta}>
                Reactivate FormaOS →
              </Button>
            </Section>
            <Text style={text}>
              What could we have done better? We&apos;d love your feedback —
              just reply to this email.
            </Text>
            <Hr
              style={{ borderColor: 'rgba(34,211,238,0.1)', margin: '24px 0' }}
            />
            <Text style={footer}>— The FormaOS Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============================================================
// 12. Team Member Invitation
// ============================================================
interface TeamInviteProps {
  inviterName?: string;
  orgName?: string;
  inviteUrl?: string;
}

export function TeamInviteEmail({
  inviterName = 'Someone',
  orgName = 'An Organization',
  inviteUrl = `${BASE}/join`,
}: TeamInviteProps) {
  return (
    <Html>
      <Head />
      <Preview>{inviterName} has invited you to FormaOS</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>
          <Section style={content}>
            <Heading style={h2}>You&apos;ve been invited!</Heading>
            <Text style={text}>
              <strong style={{ color: '#f1f5f9' }}>{inviterName}</strong> has
              invited you to join <strong style={cyan}>{orgName}</strong> on
              FormaOS — the compliance operating system for modern teams.
            </Text>
            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button href={inviteUrl} style={cta}>
                Accept Invitation →
              </Button>
            </Section>
            <Text style={{ ...text, fontSize: '13px', color: '#64748b' }}>
              This invitation expires in 7 days.
            </Text>
            <Hr
              style={{ borderColor: 'rgba(34,211,238,0.1)', margin: '24px 0' }}
            />
            <Text style={footer}>— The FormaOS Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
