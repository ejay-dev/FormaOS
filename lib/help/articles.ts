export type HelpArticle = {
  id: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  routes: string[];
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'getting-started',
    title: 'Getting Started on FormaOS',
    summary: 'Set up your compliance workspace and find value in minutes.',
    body:
      'Start by creating your first compliance task, uploading evidence to the vault, and inviting a teammate. FormaOS will automatically connect tasks, evidence, and controls into a live compliance system.',
    tags: ['onboarding', 'tasks', 'evidence'],
    routes: ['/app'],
  },
  {
    id: 'tasks',
    title: 'Creating and Managing Tasks',
    summary: 'Assign owners, due dates, and evidence requirements.',
    body:
      'Use the Tasks module to create compliance requirements, assign owners, and link evidence. Tasks with linked evidence are automatically tracked in audit reporting.',
    tags: ['tasks', 'controls'],
    routes: ['/app/tasks'],
  },
  {
    id: 'evidence',
    title: 'Uploading Evidence to the Vault',
    summary: 'Keep compliance artifacts organized and audit-ready.',
    body:
      'Evidence Vault stores compliance artifacts securely. Upload documents, tag them to tasks or policies, and track verification status in real time.',
    tags: ['evidence', 'vault'],
    routes: ['/app/vault'],
  },
  {
    id: 'reports',
    title: 'Generating Compliance Reports',
    summary: 'Create audit exports and compliance snapshots.',
    body:
      'Reports give you a compliance snapshot and audit export packages. Run a gap analysis, resolve blockers, then export to PDF or HTML.',
    tags: ['reports', 'audit', 'compliance'],
    routes: ['/app/reports'],
  },
  {
    id: 'settings',
    title: 'Organization Settings & Governance',
    summary: 'Manage org details, access controls, and security policies.',
    body:
      'Update organization details, set governance rules, and configure security controls from Settings. Ensure your org profile stays current for audits.',
    tags: ['settings', 'governance'],
    routes: ['/app/settings'],
  },
  {
    id: 'invites',
    title: 'Inviting Teammates',
    summary: 'Bring your compliance team into FormaOS securely.',
    body:
      'Invite teammates from the Team module. Assign roles to ensure proper access and accountability across compliance workflows.',
    tags: ['team', 'roles'],
    routes: ['/app/team'],
  },
  {
    id: 'automation',
    title: 'Automation Timeline Insights',
    summary: 'See what FormaOS is automating on your behalf.',
    body:
      'The Automation timeline logs everything FormaOS is doing behind the scenes: task creation, evidence reminders, and compliance checks.',
    tags: ['automation', 'timeline'],
    routes: ['/app', '/app/dashboard'],
  },
];
