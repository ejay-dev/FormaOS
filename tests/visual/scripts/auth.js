/**
 * BackstopJS authentication script for app pages
 * Simulates user authentication for protected routes
 */

module.exports = async (page, scenario, vp) => {
  console.log('AUTH > ' + scenario.label);

  // For visual testing, we'll simulate authentication by setting localStorage
  // In a real scenario, you'd use actual login credentials
  await page.evaluateOnNewDocument(() => {
    // Set mock authentication state
    localStorage.setItem(
      'supabase.auth.token',
      JSON.stringify({
        access_token: 'mock_token_for_visual_testing',
        user: {
          id: 'test-user-id',
          email: 'test@formaos.com',
          role: 'authenticated',
        },
        expires_at: Date.now() + 3600000, // 1 hour from now
      }),
    );

    // Set organization context
    localStorage.setItem(
      'formaos.current_org',
      JSON.stringify({
        id: 'test-org-id',
        name: 'Test Organization',
        role: 'owner',
      }),
    );
  });

  // Wait for auth state to be set
  await page.waitForTimeout(1000);
};
