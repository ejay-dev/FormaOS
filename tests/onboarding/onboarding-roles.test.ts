import { isProvisioningRole } from '@/lib/onboarding/roles';

describe('onboarding provisioning roles', () => {
  it('allows owners and admins', () => {
    expect(isProvisioningRole('owner')).toBe(true);
    expect(isProvisioningRole('admin')).toBe(true);
    expect(isProvisioningRole('compliance_officer')).toBe(true);
  });

  it('blocks non-admin roles', () => {
    expect(isProvisioningRole('member')).toBe(false);
    expect(isProvisioningRole('viewer')).toBe(false);
    expect(isProvisioningRole('staff')).toBe(false);
  });
});
