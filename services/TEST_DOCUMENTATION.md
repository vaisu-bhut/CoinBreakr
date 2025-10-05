# CoinBreakr Test Suite Documentation

## Overview

This comprehensive test suite covers all aspects of the CoinBreakr API, ensuring reliability, security, and performance. The tests are designed to catch every possible edge case and failure scenario.

## Test Structure

```
tests/
├── setup.js                           # Test environment setup
├── run-tests.js                       # Test runner script
├── integration/                       # Integration tests
│   ├── auth.integration.test.js      # Authentication flow tests
│   ├── users.integration.test.js     # User management tests
│   └── expenses.integration.test.js  # Expense management tests
├── performance/                       # Performance tests
│   ├── load.performance.test.js      # Load testing
│   ├── stress.performance.test.js    # Stress testing
│   └── artillery.config.yml          # Artillery configuration
├── smoke/                            # Smoke tests
│   └── basic.smoke.test.js          # Basic functionality tests
├── edge-cases/                       # Edge case tests
│   ├── security.edge-cases.test.js  # Security attack vectors
│   └── data-validation.edge-cases.test.js # Data validation edge cases
└── database/                         # Database tests
    └── data-integrity.database.test.js # Data integrity tests
```

## Test Categories

### 1. Smoke Tests (`tests/smoke/`)
**Purpose**: Verify basic functionality and server health
**Coverage**:
- Server startup and health checks
- Basic authentication (register/login)
- Core user operations
- Basic expense operations
- Error handling for common scenarios

**Run**: `npm run test:smoke` or `npm run test:run-smoke`

### 2. Integration Tests (`tests/integration/`)
**Purpose**: End-to-end testing of complete user workflows
**Coverage**:
- Full authentication flows
- User management (search, friends, balances)
- Expense lifecycle (create, read, update, delete, settle)
- API response formats and pagination
- Error handling and validation

**Run**: `npm run test:integration` or `npm run test:run-integration`

### 3. Performance Tests (`tests/performance/`)
**Purpose**: Load testing and performance validation
**Coverage**:
- Concurrent request handling
- Memory usage under load
- Database performance
- Response time validation
- Connection pool management

**Run**: `npm run test:performance` or `npm run test:run-performance`

### 4. Edge Case Tests (`tests/edge-cases/`)
**Purpose**: Security and validation edge cases
**Coverage**:
- SQL injection prevention
- XSS attack prevention
- NoSQL injection prevention
- Authentication bypass attempts
- Input validation edge cases
- Business logic attacks

**Run**: `npm run test:edge-cases` or `npm run test:run-edge-cases`

### 5. Database Tests (`tests/database/`)
**Purpose**: Data integrity and consistency
**Coverage**:
- Referential integrity
- Concurrent operations
- Data validation at database level
- Index performance
- Transaction handling
- Memory management

**Run**: `npm run test:database` or `npm run test:run-database`

## Running Tests

### Individual Test Suites
```bash
# Smoke tests only
npm run test:smoke

# Integration tests only
npm run test:integration

# Performance tests only
npm run test:performance

# Edge case tests only
npm run test:edge-cases

# Database tests only
npm run test:database
```

### Using the Test Runner
```bash
# Run all tests with detailed output
npm run test:run

# Run specific test suite
npm run test:run-smoke
npm run test:run-integration
npm run test:run-performance
npm run test:run-edge-cases
npm run test:run-database
```

### Artillery Stress Testing
```bash
# Run Artillery stress tests
npm run test:stress
```

### All Tests
```bash
# Run all tests with Jest
npm run test:all

# Run all tests with custom runner
npm run test:run
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Test environment: Node.js
- Setup file: `tests/setup.js`
- Test timeout: 30 seconds
- Force exit: true (for cleanup)
- Clear mocks between tests

### Test Setup (`tests/setup.js`)
- MongoDB Memory Server for isolated testing
- Automatic database cleanup between tests
- Global test utilities
- Connection management

## Test Data Management

### Test Users
Each test suite creates its own test users to avoid conflicts:
- `Security Test User` - for security tests
- `Validation Test User` - for validation tests
- `Database Test User` - for database tests
- `Performance Test User` - for performance tests

### Test Data Cleanup
- All collections are cleared before each test
- In-memory MongoDB instance is used
- No persistent test data between runs

## Security Test Coverage

### Authentication Security
- JWT token validation
- Token manipulation attempts
- Authentication bypass attempts
- Privilege escalation prevention
- Token replay attacks

### Input Validation Security
- SQL injection prevention
- NoSQL injection prevention
- XSS attack prevention
- Path traversal prevention
- Header injection prevention
- Buffer overflow protection

### Business Logic Security
- Negative amount prevention
- Self-expense prevention
- Amount manipulation prevention
- Unauthorized access prevention

## Performance Test Coverage

### Load Testing
- 1000 concurrent requests
- 500 concurrent expense creations
- 200 concurrent user operations
- Mixed workload scenarios

### Stress Testing
- Memory usage under load
- Database connection exhaustion
- CPU intensive operations
- Long-running performance tests

### Artillery Configuration
- Warm-up phase (60s)
- Ramp-up phase (120s)
- Sustained load (300s)
- Peak load (60s)
- Cool-down phase (60s)

## Edge Case Coverage

### Data Validation
- Boundary value testing
- Type coercion testing
- Empty/null value handling
- Special character handling
- Unicode character support

### Date Handling
- Various date formats
- Invalid date rejection
- Future date handling
- Timezone handling

### ObjectId Validation
- Invalid format rejection
- Non-existent ID handling
- Malformed ID handling

## Database Test Coverage

### Data Integrity
- Referential integrity maintenance
- Bidirectional relationship consistency
- Cascade operation handling
- Orphaned data handling

### Concurrent Operations
- Friend addition/removal
- Expense creation/updates
- Settlement operations
- Data consistency under load

### Performance
- Index efficiency testing
- Query performance validation
- Memory usage monitoring
- Connection pool management

## Test Results and Reporting

### Success Criteria
- All smoke tests must pass
- All integration tests must pass
- Performance tests must meet response time requirements
- Security tests must prevent all attack vectors
- Database tests must maintain data integrity

### Failure Handling
- Detailed error messages
- Stack trace information
- Test execution time tracking
- Memory usage monitoring

## Continuous Integration

### CI Configuration
```bash
# Run tests in CI environment
npm run test:ci
```

### Test Requirements
- All tests must pass
- No memory leaks
- Response times within limits
- Security vulnerabilities prevented

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   - Ensure MongoDB Memory Server is properly installed
   - Check for port conflicts
   - Verify test setup configuration

2. **Memory Issues**
   - Increase Node.js memory limit: `--max-old-space-size=4096`
   - Check for memory leaks in tests
   - Monitor memory usage during performance tests

3. **Timeout Issues**
   - Increase Jest timeout in configuration
   - Check for hanging database connections
   - Verify test cleanup procedures

4. **Authentication Issues**
   - Verify JWT secret configuration
   - Check token expiration settings
   - Ensure proper test user creation

### Debug Mode
```bash
# Run tests with debug output
DEBUG=* npm run test:integration
```

## Best Practices

### Test Writing
- Use descriptive test names
- Test one scenario per test case
- Clean up test data after each test
- Use proper assertions
- Handle async operations correctly

### Test Organization
- Group related tests in describe blocks
- Use beforeEach/afterEach for setup/cleanup
- Keep tests independent
- Use meaningful test data

### Performance Testing
- Monitor memory usage
- Test realistic scenarios
- Use appropriate load levels
- Validate response times
- Check for resource leaks

## Maintenance

### Regular Updates
- Update test dependencies
- Review and update test cases
- Monitor test execution times
- Update security test vectors
- Validate performance benchmarks

### Test Coverage
- Monitor test coverage metrics
- Add tests for new features
- Update edge case tests
- Review security test coverage
- Validate database test coverage

## Conclusion

This comprehensive test suite ensures the CoinBreakr API is robust, secure, and performant. The tests cover every possible scenario and edge case, providing confidence in the system's reliability and security.

For questions or issues with the test suite, please refer to the troubleshooting section or contact the development team.
