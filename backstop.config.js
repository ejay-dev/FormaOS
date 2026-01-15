module.exports = {
  id: 'formaos_visual_regression',
  viewports: [
    {
      label: 'mobile',
      width: 320,
      height: 568,
    },
    {
      label: 'tablet',
      width: 768,
      height: 1024,
    },
    {
      label: 'desktop',
      width: 1920,
      height: 1080,
    },
    {
      label: 'desktop_large',
      width: 2560,
      height: 1440,
    },
  ],
  onBeforeScript: 'tests/visual/scripts/onBefore.js',
  onReadyScript: 'tests/visual/scripts/onReady.js',
  scenarios: [
    // Marketing pages
    {
      label: 'homepage',
      url: 'http://localhost:3000',
      delay: 1000,
      requireSameDimensions: true,
    },
    {
      label: 'pricing_page',
      url: 'http://localhost:3000/pricing',
      delay: 1000,
      requireSameDimensions: true,
    },
    {
      label: 'features_page',
      url: 'http://localhost:3000/features',
      delay: 1000,
      requireSameDimensions: true,
    },
    {
      label: 'contact_page',
      url: 'http://localhost:3000/contact',
      delay: 1000,
      requireSameDimensions: true,
    },

    // App pages (requires authentication)
    {
      label: 'app_dashboard',
      url: 'http://localhost:3000/app',
      delay: 2000,
      requireSameDimensions: true,
      onBeforeScript: 'tests/visual/scripts/auth.js',
    },
    {
      label: 'app_policies',
      url: 'http://localhost:3000/app/policies',
      delay: 2000,
      requireSameDimensions: true,
      onBeforeScript: 'tests/visual/scripts/auth.js',
    },
    {
      label: 'app_tasks',
      url: 'http://localhost:3000/app/tasks',
      delay: 2000,
      requireSameDimensions: true,
      onBeforeScript: 'tests/visual/scripts/auth.js',
    },
    {
      label: 'app_team',
      url: 'http://localhost:3000/app/team',
      delay: 2000,
      requireSameDimensions: true,
      onBeforeScript: 'tests/visual/scripts/auth.js',
    },

    // Admin pages (requires founder authentication)
    {
      label: 'admin_dashboard',
      url: 'http://localhost:3000/admin',
      delay: 2000,
      requireSameDimensions: true,
      onBeforeScript: 'tests/visual/scripts/adminAuth.js',
    },

    // Error pages
    {
      label: '404_page',
      url: 'http://localhost:3000/nonexistent',
      delay: 1000,
      requireSameDimensions: true,
    },
    {
      label: 'unauthorized_page',
      url: 'http://localhost:3000/unauthorized',
      delay: 1000,
      requireSameDimensions: true,
    },
  ],
  paths: {
    bitmaps_reference: 'tests/visual/backstop_data/bitmaps_reference',
    bitmaps_test: 'tests/visual/backstop_data/bitmaps_test',
    engine_scripts: 'tests/visual/backstop_data/engine_scripts',
    html_report: 'tests/visual/backstop_data/html_report',
    ci_report: 'tests/visual/backstop_data/ci_report',
  },
  report: ['browser', 'CI'],
  engine: 'playwright',
  engineOptions: {
    browser: 'chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
  asyncCaptureLimit: 5,
  asyncCompareLimit: 50,
  debug: false,
  debugWindow: false,
  resembleOutputOptions: {
    errorColor: {
      red: 255,
      green: 0,
      blue: 255,
    },
    errorType: 'movement',
    transparency: 0.3,
    largeImageThreshold: 1200,
    useCrossOrigin: false,
  },
  misMatchThreshold: 0.1,
};
