// e2e/role-based-dashboards.spec.ts
import { test, expect } from '@playwright/test';

const users = {
  admin: {
    email: 'admin@formaos.com',
    password: 'admin123',
    role: 'admin',
  },
  compliance_manager: {
    email: 'compliance@formaos.com',
    password: 'compliance123',
    role: 'compliance_manager',
  },
  employee: {
    email: 'employee@formaos.com',
    password: 'employee123',
    role: 'employee',
  },
};

test.describe('Role-Based Dashboards', () => {
  test('Admin dashboard access and functionality', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', users.admin.email);
    await page.fill('input[type="password"]', users.admin.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should see admin dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/admin dashboard/i)).toBeVisible();

    // Admin-specific features should be visible
    await expect(
      page.getByRole('button', { name: /manage users/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /system settings/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /audit logs/i }),
    ).toBeVisible();

    // Check admin navigation items
    await expect(
      page.getByRole('link', { name: /user management/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /compliance overview/i }),
    ).toBeVisible();

    // Test admin-specific actions
    await page.getByRole('button', { name: /manage users/i }).click();
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText(/user management/i)).toBeVisible();
  });

  test('Compliance Manager dashboard access and restrictions', async ({
    page,
  }) => {
    // Login as compliance manager
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', users.compliance_manager.email);
    await page.fill(
      'input[type="password"]',
      users.compliance_manager.password,
    );
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should see compliance dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/compliance dashboard/i)).toBeVisible();

    // Compliance-specific features should be visible
    await expect(
      page.getByRole('button', { name: /compliance graph/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /audit reports/i }),
    ).toBeVisible();

    // Admin features should NOT be visible
    await expect(
      page.getByRole('button', { name: /manage users/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: /system settings/i }),
    ).not.toBeVisible();

    // Test compliance-specific navigation
    await page.getByRole('link', { name: /compliance graph/i }).click();
    await expect(page).toHaveURL(/\/compliance/);
    await expect(page.getByText(/compliance graph/i)).toBeVisible();
  });

  test('Employee dashboard access and limitations', async ({ page }) => {
    // Login as employee
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', users.employee.email);
    await page.fill('input[type="password"]', users.employee.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should see employee dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/my dashboard/i)).toBeVisible();

    // Employee-specific features should be visible
    await expect(page.getByRole('button', { name: /my tasks/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /training/i })).toBeVisible();

    // Management features should NOT be visible
    await expect(
      page.getByRole('button', { name: /manage users/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: /compliance graph/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: /audit reports/i }),
    ).not.toBeVisible();

    // Navigation should be limited
    await expect(page.getByRole('link', { name: /admin/i })).not.toBeVisible();
    await expect(
      page.getByRole('link', { name: /user management/i }),
    ).not.toBeVisible();
  });

  test('Role-based route protection', async ({ page }) => {
    // Login as employee
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', users.employee.email);
    await page.fill('input[type="password"]', users.employee.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Try to access admin routes
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/unauthorized/);
    await expect(page.getByText(/access denied/i)).toBeVisible();

    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/unauthorized/);

    // Try to access compliance routes
    await page.goto('/compliance/reports');
    await expect(page).toHaveURL(/\/unauthorized/);
  });

  test('Dynamic menu rendering based on role', async ({ page }) => {
    // Test admin menu
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', users.admin.email);
    await page.fill('input[type="password"]', users.admin.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    const adminMenu = page.getByRole('navigation');
    await expect(
      adminMenu.getByRole('link', { name: /dashboard/i }),
    ).toBeVisible();
    await expect(adminMenu.getByRole('link', { name: /users/i })).toBeVisible();
    await expect(
      adminMenu.getByRole('link', { name: /compliance/i }),
    ).toBeVisible();
    await expect(
      adminMenu.getByRole('link', { name: /settings/i }),
    ).toBeVisible();

    // Logout and test compliance manager menu
    await page.getByRole('button', { name: /logout/i }).click();
    await page.fill('input[type="email"]', users.compliance_manager.email);
    await page.fill(
      'input[type="password"]',
      users.compliance_manager.password,
    );
    await page.getByRole('button', { name: /sign in/i }).click();

    const complianceMenu = page.getByRole('navigation');
    await expect(
      complianceMenu.getByRole('link', { name: /dashboard/i }),
    ).toBeVisible();
    await expect(
      complianceMenu.getByRole('link', { name: /compliance/i }),
    ).toBeVisible();
    await expect(
      complianceMenu.getByRole('link', { name: /users/i }),
    ).not.toBeVisible();
    await expect(
      complianceMenu.getByRole('link', { name: /settings/i }),
    ).not.toBeVisible();
  });
});
