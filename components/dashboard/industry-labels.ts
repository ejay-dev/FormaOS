export function getExpiryLabel(industry?: string | null): string {
  switch (industry) {
    case 'ndis':
      return 'Screening Expiry';
    case 'healthcare':
      return 'Registration Expiry';
    case 'childcare':
      return 'WWCC Expiry';
    case 'aged_care':
      return 'Credential Expiry';
    case 'saas_technology':
      return 'Cert Expiry';
    default:
      return 'Expiring Soon';
  }
}

export function getEntityLabel(industry?: string | null): string {
  switch (industry) {
    case 'ndis':
      return 'participant compliance';
    case 'healthcare':
      return 'clinical';
    case 'aged_care':
      return 'resident care';
    case 'childcare':
      return 'child safety';
    case 'community_services':
      return 'client service';
    case 'financial_services':
      return 'regulatory';
    case 'saas_technology':
      return 'security control';
    case 'enterprise':
      return 'enterprise compliance';
    default:
      return 'control';
  }
}

export function getTasksLabel(industry?: string | null): string {
  switch (industry) {
    case 'ndis':
      return 'Compliance Tasks';
    case 'healthcare':
      return 'Clinical Tasks';
    case 'aged_care':
      return 'Care Tasks';
    case 'childcare':
      return 'Safety Tasks';
    case 'community_services':
      return 'Service Tasks';
    case 'financial_services':
      return 'Regulatory Tasks';
    case 'saas_technology':
      return 'Control Tasks';
    case 'enterprise':
      return 'Governance Tasks';
    default:
      return 'Open Tasks';
  }
}
