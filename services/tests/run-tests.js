#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const testSuites = [
  {
    name: 'Smoke Tests',
    pattern: 'smoke',
    description: 'Basic functionality verification'
  },
  {
    name: 'Integration Tests',
    pattern: 'integration',
    description: 'End-to-end API testing'
  },
  {
    name: 'Performance Tests',
    pattern: 'performance',
    description: 'Load and stress testing'
  },
  {
    name: 'Edge Case Tests',
    pattern: 'edge-cases',
    description: 'Security and validation edge cases'
  },
  {
    name: 'Database Tests',
    pattern: 'database',
    description: 'Data integrity and consistency'
  }
];

function runTestSuite(suite) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running ${suite.name}...`);
    console.log(`📝 ${suite.description}\n`);

    const jest = spawn('npx', ['jest', `--testPathPattern=${suite.pattern}`, '--verbose'], {
      stdio: 'inherit',
      shell: true
    });

    jest.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${suite.name} completed successfully\n`);
        resolve();
      } else {
        console.log(`❌ ${suite.name} failed with code ${code}\n`);
        reject(new Error(`${suite.name} failed`));
      }
    });

    jest.on('error', (error) => {
      console.log(`❌ ${suite.name} failed to start: ${error.message}\n`);
      reject(error);
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting CoinBreakr Test Suite');
  console.log('=====================================\n');

  const startTime = Date.now();
  const results = [];

  for (const suite of testSuites) {
    try {
      await runTestSuite(suite);
      results.push({ name: suite.name, status: 'PASSED' });
    } catch (error) {
      results.push({ name: suite.name, status: 'FAILED', error: error.message });
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('📊 Test Results Summary');
  console.log('========================');
  
  results.forEach(result => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\n⏱️  Total execution time: ${duration} seconds`);

  const passedTests = results.filter(r => r.status === 'PASSED').length;
  const totalTests = results.length;

  console.log(`\n📈 Overall Result: ${passedTests}/${totalTests} test suites passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The CoinBreakr API is ready for production.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
CoinBreakr Test Runner

Usage:
  node tests/run-tests.js [options]

Options:
  --help, -h          Show this help message
  --smoke             Run only smoke tests
  --integration       Run only integration tests
  --performance       Run only performance tests
  --edge-cases        Run only edge case tests
  --database          Run only database tests
  --all               Run all tests (default)

Examples:
  node tests/run-tests.js --smoke
  node tests/run-tests.js --integration --performance
  node tests/run-tests.js --all
`);
  process.exit(0);
}

if (args.includes('--smoke')) {
  runTestSuite(testSuites[0]).then(() => process.exit(0)).catch(() => process.exit(1));
} else if (args.includes('--integration')) {
  runTestSuite(testSuites[1]).then(() => process.exit(0)).catch(() => process.exit(1));
} else if (args.includes('--performance')) {
  runTestSuite(testSuites[2]).then(() => process.exit(0)).catch(() => process.exit(1));
} else if (args.includes('--edge-cases')) {
  runTestSuite(testSuites[3]).then(() => process.exit(0)).catch(() => process.exit(1));
} else if (args.includes('--database')) {
  runTestSuite(testSuites[4]).then(() => process.exit(0)).catch(() => process.exit(1));
} else {
  // Run all tests by default
  runAllTests().catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}
