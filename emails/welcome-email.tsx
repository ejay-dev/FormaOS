import {
  Img,
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

const DEFAULT_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au';

interface WelcomeEmailProps {
  userName?: string;
  organizationName?: string;
  loginUrl?: string;
}

export default function WelcomeEmail({
  userName = 'there',
  organizationName = 'My Organization',
  loginUrl = `${DEFAULT_APP_URL.replace(/\/$/, '')}/app`,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your FormaOS workspace is ready</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img src="https://app.formaos.com.au/brand/formaos-wordmark-white.png" width="170" height="17" alt="FormaOS" style={logo} />
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={h2}>Welcome, {userName}</Heading>

            <Text style={text}>
              Your workspace for{' '}
              <strong style={{ color: '#ffffff' }}>{organizationName}</strong> is
              ready to use.
            </Text>

            <Text style={text}>FormaOS helps your team manage:</Text>

            <Section style={featureList}>
              {[
                'Governance policies and compliance frameworks',
                'Task management and compliance roadmaps',
                'Evidence collection and secure storage',
                'Tamper-proof audit trails and logs',
                'Team collaboration with role-based access',
              ].map((feature) => (
                <Text key={feature} style={featureItem}>
                  <span style={{ color: '#ffffff', fontWeight: '700' }}>✓</span>
                  &nbsp;&nbsp;{feature}
                </Text>
              ))}
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Go to Dashboard →
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={footer}>— The FormaOS Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#111213',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const container = {
  backgroundColor: '#1c1e1f',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '12px',
  overflow: 'hidden' as const,
};

const header = {
  background: '#16181a',
  borderBottom: '1px solid rgba(255,255,255,0.2)',
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const logo = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '800',
  margin: '0',
  letterSpacing: '-0.5px',
};

const tagline = {
  color: '#b8b8b8',
  fontSize: '12px',
  margin: '6px 0 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
};

const content = {
  padding: '36px 40px',
};

const h2 = {
  color: '#ededed',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 20px',
};

const text = {
  color: '#b8b8b8',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '16px 0',
};

const featureList = {
  margin: '20px 0',
};

const featureItem = {
  color: '#d4d4d4',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '8px 0',
};

const buttonContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  color: '#111213',
  fontSize: '15px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const divider = {
  borderColor: 'rgba(255,255,255,0.1)',
  margin: '24px 0',
};

const footer = {
  color: '#6b6b6b',
  fontSize: '13px',
  marginTop: '16px',
  fontStyle: 'italic' as const,
};
