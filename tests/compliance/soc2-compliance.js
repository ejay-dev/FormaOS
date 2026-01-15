/**
 * SOC2 Compliance Testing Script
 * Validates security controls for Type II audit readiness
 */

const playwright = require('playwright');
const fs = require('fs').promises;
const https = require('https');
const crypto = require('crypto');

class SOC2ComplianceTest {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      timestamp: new Date().toISOString(),
      controls: {
        security: [],
        availability: [],
        processing: [],
        confidentiality: [],
        privacy: [],
      },
      violations: [],
      recommendations: [],
    };
  }

  /**
   * Test Security Controls (CC6.0 series)
   */
  async testSecurityControls(page) {
    const tests = [
      {
        name: 'Authentication Requirements',
        control: 'CC6.1',
        test: async () => {
          await page.goto(`${this.baseUrl}/app`);
          // Should redirect to login if not authenticated
          const currentUrl = page.url();
          const isProtected =
            currentUrl.includes('login') || currentUrl.includes('auth');
          return {
            passed: isProtected,
            details: 'Protected resources must require authentication',
          };
        },
      },
      {
        name: 'Authorization Controls',
        control: 'CC6.2',
        test: async () => {
          // Test admin route without founder access
          const response = await page.goto(`${this.baseUrl}/admin`);
          const isRestricted =
            response.status() === 403 || page.url().includes('unauthorized');
          return {
            passed: isRestricted,
            details: 'Admin resources must enforce proper authorization',
          };
        },
      },
      {
        name: 'Session Management',
        control: 'CC6.1',
        test: async () => {
          await page.goto(this.baseUrl);
          const cookies = await page.context().cookies();
          const sessionCookies = cookies.filter(
            (cookie) =>
              cookie.name.includes('session') ||
              cookie.name.includes('auth') ||
              cookie.httpOnly === true,
          );
          return {
            passed: sessionCookies.length > 0,
            details: 'Must implement secure session management',
          };
        },
      },
      {
        name: 'Encryption in Transit',
        control: 'CC6.7',
        test: async () => {
          // Test HTTPS enforcement
          const httpsUrl = this.baseUrl.replace('http://', 'https://');
          try {
            const response = await page.goto(httpsUrl);
            return {
              passed: response.url().startsWith('https://'),
              details: 'Data transmission must be encrypted',
            };
          } catch {
            return {
              passed: false,
              details: 'HTTPS must be properly configured',
            };
          }
        },
      },
      {
        name: 'Input Validation',
        control: 'CC6.6',
        test: async () => {
          await page.goto(`${this.baseUrl}/contact`);
          // Test for basic input validation
          const form = await page.$('form');
          if (form) {
            const inputs = await page.$$('input[required], input[pattern]');
            return {
              passed: inputs.length > 0,
              details: 'Forms must implement input validation',
            };
          }
          return { passed: true, details: 'No forms found to test' };
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.results.controls.security.push({
          name: test.name,
          control: test.control,
          ...result,
        });
      } catch (error) {
        this.results.violations.push({
          category: 'Security',
          control: test.control,
          test: test.name,
          error: error.message,
        });
      }
    }
  }

  /**
   * Test Availability Controls (A1.0 series)
   */
  async testAvailabilityControls(page) {
    const tests = [
      {
        name: 'System Health Monitoring',
        control: 'A1.2',
        test: async () => {
          const response = await page.goto(`${this.baseUrl}/api/health`);
          const isHealthy = response.status() === 200;
          if (isHealthy) {
            const healthData = await response.json();
            return {
              passed: healthData.status === 'healthy',
              details: 'System health monitoring must be operational',
            };
          }
          return {
            passed: false,
            details: 'Health check endpoint must be accessible',
          };
        },
      },
      {
        name: 'Error Handling',
        control: 'A1.1',
        test: async () => {
          // Test 404 error handling
          const response = await page.goto(`${this.baseUrl}/nonexistent-page`);
          const hasErrorPage = response.status() === 404;
          return {
            passed: hasErrorPage,
            details: 'Must handle errors gracefully',
          };
        },
      },
      {
        name: 'Performance Monitoring',
        control: 'A1.2',
        test: async () => {
          const start = Date.now();
          await page.goto(this.baseUrl);
          const loadTime = Date.now() - start;
          return {
            passed: loadTime < 5000, // 5 second threshold
            details: `Page load time: ${loadTime}ms (should be < 5000ms)`,
          };
        },
      },
      {
        name: 'Backup and Recovery Indicators',
        control: 'A1.3',
        test: async () => {
          // Check for backup/recovery documentation
          await page.goto(`${this.baseUrl}/admin`);
          const backupFeatures = await page.$(
            '[data-testid="backup"], .backup, .recovery',
          );
          return {
            passed: backupFeatures !== null,
            details: 'Backup and recovery processes must be documented',
          };
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.results.controls.availability.push({
          name: test.name,
          control: test.control,
          ...result,
        });
      } catch (error) {
        this.results.violations.push({
          category: 'Availability',
          control: test.control,
          test: test.name,
          error: error.message,
        });
      }
    }
  }

  /**
   * Test Processing Integrity Controls (PI1.0 series)
   */
  async testProcessingControls(page) {
    const tests = [
      {
        name: 'Data Validation',
        control: 'PI1.1',
        test: async () => {
          // Setup authenticated session
          await page.evaluate(() => {
            localStorage.setItem(
              'supabase.auth.token',
              JSON.stringify({
                access_token: 'mock_token_for_soc2_testing',
                user: { id: 'test-user-id', email: 'test@formaos.com' },
              }),
            );
          });

          await page.goto(`${this.baseUrl}/app/policies`);
          const createForm = await page.$('form, [data-testid="create-form"]');
          if (createForm) {
            const validationInputs = await page.$$(
              'input[required], input[pattern], .validation',
            );
            return {
              passed: validationInputs.length > 0,
              details: 'Data input must be validated',
            };
          }
          return { passed: true, details: 'No data input forms found' };
        },
      },
      {
        name: 'Audit Trail',
        control: 'PI1.2',
        test: async () => {
          await page.goto(`${this.baseUrl}/api/v1/audit-logs`);
          // Check if audit logging endpoint exists
          const response = await page
            .waitForResponse((response) =>
              response.url().includes('/api/v1/audit-logs'),
            )
            .catch(() => null);
          return {
            passed: response && response.status() !== 404,
            details: 'Audit logging must be implemented',
          };
        },
      },
      {
        name: 'Data Integrity Checks',
        control: 'PI1.1',
        test: async () => {
          // Test data consistency
          await page.goto(`${this.baseUrl}/api/health/detailed`);
          const healthResponse = await page
            .waitForResponse((response) =>
              response.url().includes('/api/health/detailed'),
            )
            .catch(() => null);

          if (healthResponse) {
            const health = await healthResponse.json();
            const hasIntegrityChecks =
              health.checks &&
              (health.checks.database || health.checks.storage);
            return {
              passed: hasIntegrityChecks,
              details: 'Data integrity checks must be operational',
            };
          }
          return {
            passed: false,
            details: 'Unable to verify data integrity checks',
          };
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.results.controls.processing.push({
          name: test.name,
          control: test.control,
          ...result,
        });
      } catch (error) {
        this.results.violations.push({
          category: 'Processing Integrity',
          control: test.control,
          test: test.name,
          error: error.message,
        });
      }
    }
  }

  /**
   * Test Confidentiality Controls (C1.0 series)
   */
  async testConfidentialityControls(page) {
    const tests = [
      {
        name: 'Data Classification',
        control: 'C1.1',
        test: async () => {
          // Check for data classification indicators
          await page.goto(`${this.baseUrl}/privacy`);
          const content = await page.content();
          const hasClassification =
            content.includes('confidential') ||
            content.includes('sensitive') ||
            content.includes('personal data');
          return {
            passed: hasClassification,
            details: 'Data classification must be documented',
          };
        },
      },
      {
        name: 'Access Controls',
        control: 'C1.2',
        test: async () => {
          // Test role-based access
          await page.goto(`${this.baseUrl}/app/team`);
          const roleElements = await page.$('.role, [data-role], .permission');
          return {
            passed: roleElements !== null,
            details: 'Role-based access controls must be implemented',
          };
        },
      },
      {
        name: 'Data Encryption',
        control: 'C1.1',
        test: async () => {
          // Check for encryption indicators
          const response = await page.goto(this.baseUrl);
          const securityHeaders = response.headers();
          const hasSecurityHeaders =
            securityHeaders['strict-transport-security'] ||
            securityHeaders['x-frame-options'] ||
            securityHeaders['x-content-type-options'];
          return {
            passed: hasSecurityHeaders,
            details: 'Security headers must be implemented',
          };
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.results.controls.confidentiality.push({
          name: test.name,
          control: test.control,
          ...result,
        });
      } catch (error) {
        this.results.violations.push({
          category: 'Confidentiality',
          control: test.control,
          test: test.name,
          error: error.message,
        });
      }
    }
  }

  /**
   * Generate SOC2 compliance report
   */
  async generateReport() {
    const allTests = Object.values(this.results.controls).flat();
    const summary = {
      totalControls: allTests.length,
      passedControls: allTests.filter((test) => test.passed).length,
      failedControls: allTests.filter((test) => !test.passed).length,
      violations: this.results.violations.length,
    };

    // Generate recommendations
    if (summary.failedControls === 0 && summary.violations === 0) {
      this.results.recommendations.push(
        'Excellent! All SOC2 control tests passed.',
      );
    } else {
      if (summary.failedControls > 0) {
        this.results.recommendations.push(
          `${summary.failedControls} control tests failed. Address these for SOC2 compliance.`,
        );
      }

      // Category-specific recommendations
      const failedSecurity = this.results.controls.security.filter(
        (test) => !test.passed,
      );
      if (failedSecurity.length > 0) {
        this.results.recommendations.push(
          'Security controls need attention. Implement proper authentication and authorization.',
        );
      }

      const failedAvailability = this.results.controls.availability.filter(
        (test) => !test.passed,
      );
      if (failedAvailability.length > 0) {
        this.results.recommendations.push(
          'Availability controls need improvement. Ensure proper monitoring and error handling.',
        );
      }

      const failedProcessing = this.results.controls.processing.filter(
        (test) => !test.passed,
      );
      if (failedProcessing.length > 0) {
        this.results.recommendations.push(
          'Processing integrity controls missing. Implement audit trails and data validation.',
        );
      }
    }

    return { ...this.results, summary };
  }

  /**
   * Run full SOC2 compliance test
   */
  async runSOC2Compliance() {
    console.log('🔐 Running SOC2 compliance tests...');

    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await this.testSecurityControls(page);
      await this.testAvailabilityControls(page);
      await this.testProcessingControls(page);
      await this.testConfidentialityControls(page);

      const report = await this.generateReport();

      console.log('📊 SOC2 Compliance Summary:');
      console.log(`Total Controls: ${report.summary.totalControls}`);
      console.log(`Passed: ${report.summary.passedControls}`);
      console.log(`Failed: ${report.summary.failedControls}`);
      console.log(`Violations: ${report.summary.violations}`);

      if (report.summary.failedControls > 0 || report.summary.violations > 0) {
        console.log('❌ SOC2 compliance issues found');
      } else {
        console.log('✅ SOC2 compliance tests passed');
      }

      return report;
    } finally {
      await browser.close();
    }
  }
}

module.exports = SOC2ComplianceTest;

// Run if called directly
if (require.main === module) {
  const soc2Test = new SOC2ComplianceTest();
  soc2Test
    .runSOC2Compliance()
    .then((results) => {
      console.log('SOC2 Compliance test completed');
      require('fs').writeFileSync(
        'tests/compliance/reports/soc2-compliance-report.json',
        JSON.stringify(results, null, 2),
      );
    })
    .catch(console.error);
}
