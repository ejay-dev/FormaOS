import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

const DEFAULT_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au';

interface InviteEmailProps {
  inviterName?: string;
  inviterEmail?: string;
  organizationName?: string;
  inviteUrl?: string;
  role?: string;
}

export default function InviteEmail({
  inviterName = 'A team member',
  inviterEmail = 'member@formaos.com',
  organizationName = 'Organization',
  inviteUrl = `${DEFAULT_APP_URL.replace(/\/$/, '')}/accept-invite`,
  role = 'member',
}: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been invited to join {organizationName} on FormaOS</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>FormaOS</Heading>
          </Section>

          <Section style={content}>
            <Heading style={h2}>You've been invited! 🎉</Heading>
            
            <Text style={text}>
              <strong>{inviterName}</strong> ({inviterEmail}) has invited you to join{' '}
              <strong>{organizationName}</strong> on FormaOS.
            </Text>

            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>Organization:</strong> {organizationName}
              </Text>
              <Text style={infoText}>
                <strong>Role:</strong> {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
              <Text style={infoText}>
                <strong>Invited by:</strong> {inviterName}
              </Text>
            </Section>

            <Text style={text}>
              FormaOS is a comprehensive compliance operating system that helps teams manage
              governance, policies, evidence collection, and audit trails—all in one place.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={inviteUrl}>
                Accept Invitation
              </Button>
            </Section>

            <Text style={smallText}>
              This invitation link will expire in 7 days. If you don't want to join this
              organization, you can safely ignore this email.
            </Text>

            <Text style={footer}>
              — The FormaOS Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e6e6e6',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0',
  padding: '0',
};

const content = {
  padding: '32px 40px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 20px',
};

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const infoBox = {
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const infoText = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '8px 0',
};

const buttonContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#667eea',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const smallText = {
  color: '#8a8a8a',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '16px 0',
};

const footer = {
  color: '#8a8a8a',
  fontSize: '14px',
  marginTop: '32px',
  fontStyle: 'italic',
};
