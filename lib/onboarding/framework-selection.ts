import { PACK_SLUGS } from '@/lib/frameworks/framework-installer';

const FRAMEWORK_ENGINE_SLUGS = new Set([
  ...PACK_SLUGS,
  'iso27001',
  'hipaa',
  'gdpr',
  'pci-dss',
  'soc2',
  'nist-csf',
  'cis-controls',
]);

export function getProvisioningFrameworkSlugs(frameworks: string[]) {
  return frameworks
    .map((entry) => entry.toLowerCase().trim())
    .filter((entry) => FRAMEWORK_ENGINE_SLUGS.has(entry));
}

export function isFrameworkProvisionable(frameworkSlug: string) {
  return FRAMEWORK_ENGINE_SLUGS.has(frameworkSlug.toLowerCase().trim());
}
