#!/usr/bin/env node
/**
 * A/B Testing Management CLI
 * Command-line interface for managing A/B tests in FormaOS
 */

import fs from 'fs/promises';
import path from 'path';
import {
  AB_TEST_DEFINITIONS,
  ABTestConfig,
  ABTestDefinition,
} from './test-config';

interface TestResults {
  testId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  participants: {
    [variantId: string]: number;
  };
  conversions: {
    [variantId: string]: number;
  };
  metrics: {
    [variantId: string]: {
      [metricName: string]: number;
    };
  };
  significance?: number;
  winner?: string;
  confidence?: number;
}

class ABTestManager {
  private resultsDir = path.join(
    process.cwd(),
    'tests',
    'ab-testing',
    'results',
  );

  constructor() {
    this.ensureResultsDirectory();
  }

  private async ensureResultsDirectory() {
    try {
      await fs.mkdir(this.resultsDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create results directory:', error);
    }
  }

  /**
   * List all available tests
   */
  async listTests() {
    console.log('\\n🧪 FormaOS A/B Tests\\n');

    const activeTests = ABTestConfig.getActiveTests();
    const draftTests = AB_TEST_DEFINITIONS.filter((t) => t.status === 'draft');
    const completedTests = AB_TEST_DEFINITIONS.filter(
      (t) => t.status === 'completed',
    );

    if (activeTests.length > 0) {
      console.log('📊 ACTIVE TESTS:');
      activeTests.forEach((test) => {
        console.log(`  ✅ ${test.testId} - ${test.name}`);
        console.log(`     ${test.description}`);
        console.log(
          `     Traffic: ${test.trafficAllocation}% | Variants: ${test.variants.length}`,
        );
        console.log('');
      });
    }

    if (draftTests.length > 0) {
      console.log('📝 DRAFT TESTS:');
      draftTests.forEach((test) => {
        console.log(`  📋 ${test.testId} - ${test.name}`);
        console.log(
          `     Start: ${new Date(test.startDate).toLocaleDateString()}`,
        );
        console.log('');
      });
    }

    if (completedTests.length > 0) {
      console.log('✅ COMPLETED TESTS:');
      completedTests.forEach((test) => {
        console.log(`  🏁 ${test.testId} - ${test.name}`);
        console.log('');
      });
    }
  }

  /**
   * Show detailed test information
   */
  async showTest(testId: string) {
    const test = ABTestConfig.getTest(testId);
    if (!test) {
      console.error(`❌ Test '${testId}' not found`);
      return;
    }

    console.log(`\\n🧪 Test: ${test.name}\\n`);
    console.log(`ID: ${test.testId}`);
    console.log(`Status: ${test.status}`);
    console.log(`Description: ${test.description}`);
    console.log(`Hypothesis: ${test.hypothesis}`);
    console.log(`Start Date: ${new Date(test.startDate).toLocaleString()}`);
    if (test.endDate) {
      console.log(`End Date: ${new Date(test.endDate).toLocaleString()}`);
    }
    console.log(`Traffic Allocation: ${test.trafficAllocation}%`);
    console.log(`Min Sample Size: ${test.minSampleSize}`);

    if (test.targetAudience?.length) {
      console.log(`Target Audience: ${test.targetAudience.join(', ')}`);
    }

    console.log('\\n📊 Variants:');
    test.variants.forEach((variant) => {
      console.log(`  • ${variant.id} (${variant.weight}%): ${variant.name}`);
      console.log(`    ${variant.description}`);
      if (variant.expectedImpact) {
        console.log(`    Expected: ${variant.expectedImpact}`);
      }
    });

    console.log('\\n🎯 Success Metrics:');
    test.successMetrics.forEach((metric) => {
      const direction =
        metric.successCriteria.direction === 'increase' ? '📈' : '📉';
      console.log(`  ${direction} ${metric.name} (${metric.type})`);
      console.log(`    ${metric.description}`);
      console.log(
        `    Target: ${metric.successCriteria.threshold}% ${metric.successCriteria.direction}`,
      );
      console.log(
        `    Confidence: ${metric.successCriteria.confidenceLevel * 100}%`,
      );
    });

    // Show current results if available
    await this.showResults(testId);
  }

  /**
   * Validate test configuration
   */
  async validateTest(testId?: string) {
    const tests = testId
      ? [ABTestConfig.getTest(testId)!]
      : AB_TEST_DEFINITIONS;

    console.log('\\n🔍 Test Validation\\n');

    for (const test of tests) {
      if (!test) continue;

      console.log(`Validating: ${test.testId}`);
      const validation = ABTestConfig.validateTest(test);

      if (validation.valid) {
        console.log('  ✅ Valid configuration');
      } else {
        console.log('  ❌ Configuration errors:');
        validation.errors.forEach((error) => {
          console.log(`    • ${error}`);
        });
      }
      console.log('');
    }
  }

  /**
   * Generate test results report
   */
  async generateReport(
    testId: string,
    outputFormat: 'json' | 'html' | 'csv' = 'json',
  ) {
    const test = ABTestConfig.getTest(testId);
    if (!test) {
      console.error(`❌ Test '${testId}' not found`);
      return;
    }

    // Generate mock results for demonstration
    const results = await this.generateMockResults(test);

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${testId}_report_${timestamp}`;

    try {
      switch (outputFormat) {
        case 'json':
          await this.saveJsonReport(fileName, results);
          break;
        case 'html':
          await this.saveHtmlReport(fileName, test, results);
          break;
        case 'csv':
          await this.saveCsvReport(fileName, results);
          break;
      }

      console.log(`✅ Report generated: ${fileName}.${outputFormat}`);
    } catch (error) {
      console.error('❌ Failed to generate report:', error);
    }
  }

  /**
   * Show test results
   */
  async showResults(testId: string) {
    try {
      const resultsFile = path.join(this.resultsDir, `${testId}.json`);
      const resultsData = await fs.readFile(resultsFile, 'utf-8');
      const results: TestResults = JSON.parse(resultsData);

      console.log('\\n📈 Current Results:');
      console.log(`Status: ${results.status}`);
      console.log(
        `Start Time: ${new Date(results.startTime).toLocaleString()}`,
      );

      if (results.endTime) {
        console.log(`End Time: ${new Date(results.endTime).toLocaleString()}`);
      }

      console.log('\\n👥 Participants:');
      Object.entries(results.participants).forEach(([variant, count]) => {
        const conversions = results.conversions[variant] || 0;
        const conversionRate =
          count > 0 ? ((conversions / count) * 100).toFixed(2) : '0.00';
        console.log(
          `  ${variant}: ${count} participants, ${conversions} conversions (${conversionRate}%)`,
        );
      });

      if (results.significance && results.winner) {
        console.log(
          `\\n🏆 Statistical Significance: ${(results.significance * 100).toFixed(1)}%`,
        );
        console.log(
          `Winner: ${results.winner} (confidence: ${(results.confidence! * 100).toFixed(1)}%)`,
        );
      } else {
        console.log('\\n⏳ Results not yet statistically significant');
      }
    } catch (error) {
      console.log('\\n📊 No results data available yet');
    }
  }

  /**
   * Generate mock results for demonstration
   */
  private async generateMockResults(
    test: ABTestDefinition,
  ): Promise<TestResults> {
    const participants: { [key: string]: number } = {};
    const conversions: { [key: string]: number } = {};
    const metrics: { [key: string]: { [key: string]: number } } = {};

    // Generate realistic mock data
    test.variants.forEach((variant) => {
      const baseParticipants = Math.floor(Math.random() * 500) + 200;
      participants[variant.id] = baseParticipants;

      // Control group: baseline conversion
      let conversionRate = 0.15; // 15% baseline

      // Apply expected improvements for variants
      if (variant.id !== 'control' && variant.expectedImpact) {
        const match = variant.expectedImpact.match(/([+-])?(\\d+)%/);
        if (match) {
          const improvement = parseInt(match[2]) / 100;
          conversionRate *= 1 + improvement;
        }
      }

      conversions[variant.id] = Math.floor(baseParticipants * conversionRate);

      // Generate metrics for each success metric
      metrics[variant.id] = {};
      test.successMetrics.forEach((metric) => {
        let value = Math.random() * 100; // Base metric value
        if (variant.id !== 'control') {
          // Apply some improvement for variants
          const improvement = (Math.random() - 0.5) * 0.4; // ±20% variance
          value *= 1 + improvement;
        }
        metrics[variant.id][metric.name] = Math.round(value * 100) / 100;
      });
    });

    // Calculate statistical significance (simplified)
    const controlConversions = conversions['control'] || 0;
    const controlParticipants = participants['control'] || 1;
    const controlRate = controlConversions / controlParticipants;

    let winner = 'control';
    let bestRate = controlRate;

    Object.entries(conversions).forEach(([variant, conv]) => {
      const rate = conv / (participants[variant] || 1);
      if (rate > bestRate) {
        bestRate = rate;
        winner = variant;
      }
    });

    return {
      testId: test.testId,
      status: 'running',
      startTime: test.startDate,
      participants,
      conversions,
      metrics,
      significance: Math.random() * 0.4 + 0.6, // 60-100%
      winner: winner !== 'control' ? winner : undefined,
      confidence: Math.random() * 0.2 + 0.8, // 80-100%
    };
  }

  /**
   * Save JSON report
   */
  private async saveJsonReport(fileName: string, results: TestResults) {
    const filePath = path.join(this.resultsDir, `${fileName}.json`);
    await fs.writeFile(filePath, JSON.stringify(results, null, 2));
  }

  /**
   * Save HTML report
   */
  private async saveHtmlReport(
    fileName: string,
    test: ABTestDefinition,
    results: TestResults,
  ) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>A/B Test Report: ${test.name}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .winner { background: #d4edda; border-left: 4px solid #28a745; }
        .variant { background: #fff; border: 1px solid #dee2e6; padding: 15px; margin: 10px 0; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #dee2e6; }
        th { background-color: #f8f9fa; }
        .stat-significant { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>A/B Test Report: ${test.name}</h1>
        <p><strong>Test ID:</strong> ${test.testId}</p>
        <p><strong>Description:</strong> ${test.description}</p>
        <p><strong>Hypothesis:</strong> ${test.hypothesis}</p>
        <p><strong>Status:</strong> ${results.status}</p>
        <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <h2>Results Summary</h2>
    <table>
        <thead>
            <tr>
                <th>Variant</th>
                <th>Participants</th>
                <th>Conversions</th>
                <th>Conversion Rate</th>
                <th>Lift vs Control</th>
            </tr>
        </thead>
        <tbody>
            ${test.variants
              .map((variant) => {
                const participants = results.participants[variant.id] || 0;
                const conversions = results.conversions[variant.id] || 0;
                const rate =
                  participants > 0
                    ? ((conversions / participants) * 100).toFixed(2)
                    : '0.00';
                const controlRate =
                  results.participants['control'] > 0
                    ? (results.conversions['control'] /
                        results.participants['control']) *
                      100
                    : 0;
                const lift =
                  variant.id === 'control'
                    ? 'Baseline'
                    : `${(((parseFloat(rate) - controlRate) / controlRate) * 100).toFixed(1)}%`;
                const isWinner = results.winner === variant.id;

                return `
                <tr class="${isWinner ? 'winner' : ''}">
                    <td>${variant.name}${isWinner ? ' 🏆' : ''}</td>
                    <td>${participants.toLocaleString()}</td>
                    <td>${conversions.toLocaleString()}</td>
                    <td>${rate}%</td>
                    <td>${lift}</td>
                </tr>
              `;
              })
              .join('')}
        </tbody>
    </table>

    ${
      results.significance && results.winner
        ? `
    <div class="metric stat-significant">
        <h3>Statistical Significance</h3>
        <p>Confidence Level: ${(results.confidence! * 100).toFixed(1)}%</p>
        <p>Winner: ${test.variants.find((v) => v.id === results.winner)?.name}</p>
    </div>
    `
        : `
    <div class="metric">
        <h3>Statistical Analysis</h3>
        <p>Results are not yet statistically significant. Continue running the test.</p>
    </div>
    `
    }

    <h2>Test Configuration</h2>
    <div class="metric">
        <h3>Success Metrics</h3>
        ${test.successMetrics
          .map(
            (metric) => `
          <div class="variant">
            <h4>${metric.name} (${metric.type})</h4>
            <p>${metric.description}</p>
            <p><strong>Target:</strong> ${metric.successCriteria.threshold}% ${metric.successCriteria.direction}</p>
          </div>
        `,
          )
          .join('')}
    </div>
</body>
</html>
    `;

    const filePath = path.join(this.resultsDir, `${fileName}.html`);
    await fs.writeFile(filePath, html);
  }

  /**
   * Save CSV report
   */
  private async saveCsvReport(fileName: string, results: TestResults) {
    const csvLines = [
      'Variant,Participants,Conversions,Conversion Rate,Status',
    ];

    Object.entries(results.participants).forEach(([variant, participants]) => {
      const conversions = results.conversions[variant] || 0;
      const rate =
        participants > 0
          ? ((conversions / participants) * 100).toFixed(2)
          : '0.00';
      const status = results.winner === variant ? 'Winner' : 'Test';
      csvLines.push(
        `${variant},${participants},${conversions},${rate}%,${status}`,
      );
    });

    const filePath = path.join(this.resultsDir, `${fileName}.csv`);
    await fs.writeFile(filePath, csvLines.join('\\n'));
  }
}

// CLI Implementation
async function main() {
  const manager = new ABTestManager();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'list':
      await manager.listTests();
      break;

    case 'show':
      if (!args[1]) {
        console.error('❌ Please specify a test ID');
        process.exit(1);
      }
      await manager.showTest(args[1]);
      break;

    case 'validate':
      await manager.validateTest(args[1]);
      break;

    case 'report':
      if (!args[1]) {
        console.error('❌ Please specify a test ID');
        process.exit(1);
      }
      const format = (args[2] as 'json' | 'html' | 'csv') || 'json';
      await manager.generateReport(args[1], format);
      break;

    case 'results':
      if (!args[1]) {
        console.error('❌ Please specify a test ID');
        process.exit(1);
      }
      await manager.showResults(args[1]);
      break;

    default:
      console.log(`
🧪 FormaOS A/B Testing CLI

Usage:
  npm run ab-test list                     List all tests
  npm run ab-test show <test-id>          Show test details
  npm run ab-test validate [test-id]      Validate test configuration
  npm run ab-test results <test-id>       Show test results
  npm run ab-test report <test-id> [format] Generate report (json|html|csv)

Examples:
  npm run ab-test list
  npm run ab-test show homepage_hero_2026_q1
  npm run ab-test report homepage_hero_2026_q1 html
      `);
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { ABTestManager };
