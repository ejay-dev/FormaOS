/**
 * BackstopJS admin authentication script
 * Simulates founder authentication for admin routes
 */

module.exports = async (page, scenario, vp) => {
  console.log('ADMIN AUTH > ' + scenario.label);

  // Set mock founder authentication
  await page.evaluateOnNewDocument(() => {
    // Set mock founder authentication state
    localStorage.setItem(
      'supabase.auth.token',
      JSON.stringify({
        access_token: 'mock_founder_token_for_visual_testing',
        user: {
          id: 'founder-user-id',
          email: 'ejazhussaini313@gmail.com', // Founder email from env
          role: 'authenticated',
          app_metadata: {
            role: 'founder',
          },
        },
        expires_at: Date.now() + 3600000,
      }),
    );

    // Set founder context
    localStorage.setItem('formaos.founder_access', 'true');
    localStorage.setItem(
      'formaos.current_org',
      JSON.stringify({
        id: 'admin-org-id',
        name: 'FormaOS Admin',
        role: 'founder',
      }),
    );
  });

  // Wait for auth state to be set
  await page.waitForTimeout(1000);
};
