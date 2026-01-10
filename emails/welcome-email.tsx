import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

const DEFAULT_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au';

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
      <Preview>Welcome to FormaOS - Your compliance journey starts now</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>FormaOS</Heading>
          </Section>

          <Section style={content}>
            <Heading style={h2}>Welcome to FormaOS, {userName}! 🎉</Heading>
            
            <Text style={text}>
              Your organization <strong>{organizationName}</strong> has been successfully created,
              and you're all set to start your compliance journey.
            </Text>

            <Text style={text}>
              FormaOS is your complete compliance operating system, helping you manage:
            </Text>

            <ul style={list}>
              <li style={listItem}>✅ Governance policies and frameworks</li>
              <li style={listItem}>✅ Task management and roadmaps</li>
              <li style={listItem}>✅ Evidence collection and storage</li>
              <li style={listItem}>✅ Audit trails and compliance logs</li>
              <li style={listItem}>✅ Team collaboration and roles</li>
            </ul>

            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Go to Dashboard
              </Button>
            </Section>

            <Text style={text}>
              Need help getting started? Check out our{' '}
              <Link href="https://docs.formaos.com" style={link}>
                documentation
              </Link>{' '}
              or reply to this email.
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

const list = {
  margin: '16px 0',
  padding: '0',
};

const listItem = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '1.8',
  margin: '8px 0',
};

const buttonContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const link = {
  color: '#667eea',
  textDecoration: 'underline',
};

const footer = {
  color: '#8a8a8a',
  fontSize: '14px',
  marginTop: '32px',
  fontStyle: 'italic',
};
