# TechScanIQ E2E Test Suite

Comprehensive end-to-end testing framework for the TechScanIQ scan-to-report pipeline.

## Overview

This test suite provides complete coverage for:
- Full pipeline E2E testing
- Service integration testing
- Performance benchmarking
- Visual regression testing
- Load testing
- Security testing

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── framework/          # Test framework and base classes
│   ├── scenarios/          # Test scenarios
│   ├── fixtures/           # Test data and mocks
│   ├── utils/              # Test utilities
│   └── global-setup.ts     # Global test setup
├── integration/            # Integration tests
│   ├── serena-integration.test.ts
│   └── setup.ts
├── performance/            # Performance tests
│   └── pipeline-performance.test.ts
├── visual/                 # Visual regression tests
│   └── report-visual.test.ts
└── mocks/                  # Mock servers and clients
```

## Setup

1. **Install dependencies:**
   ```bash
   ./scripts/install-test-deps.sh
   ```

2. **Set up test environment:**
   ```bash
   cp .env.test .env
   npm run db:test:prepare
   ```

3. **Run tests:**
   ```bash
   # Run all E2E tests
   npm run test:e2e

   # Run with UI mode
   npm run test:e2e:ui

   # Run specific test file
   npm run test:e2e -- tests/e2e/scenarios/complete-pipeline.test.ts

   # Run in debug mode
   npm run test:e2e:debug
   ```

## Test Types

### 1. E2E Pipeline Tests
Complete user journey testing from scan initiation to report generation.

```typescript
test('should complete full pipeline for simple website', async () => {
  // Test implementation
});
```

### 2. Integration Tests
Test individual service integrations (Serena MCP, AI services, etc.).

```typescript
describe('Serena MCP Integration', () => {
  // Test implementation
});
```

### 3. Performance Tests
Benchmark pipeline performance and ensure SLAs are met.

```typescript
test('should meet performance SLAs', async () => {
  // Test implementation
});
```

### 4. Visual Regression Tests
Ensure UI consistency across changes.

```typescript
test('should render technology section correctly', async () => {
  // Test implementation
});
```

## CI/CD Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Nightly builds (2 AM UTC)

GitHub Actions workflow: `.github/workflows/e2e-tests.yml`

## Environment Variables

Key test environment variables:
- `TEST_BASE_URL`: Base URL for testing (default: http://localhost:3000)
- `HEADLESS`: Run browsers in headless mode (default: true)
- `ENABLE_SERENA_TESTS`: Enable Serena integration tests
- `DEBUG`: Enable debug logging

## Performance Benchmarks

Current performance targets:
- Simple website scan: < 30 seconds
- Complex website scan: < 60 seconds
- Enterprise website scan: < 120 seconds
- Memory usage: < 500MB
- Report load time: < 3 seconds

## Visual Testing

Visual regression tests use:
- Playwright for screenshots
- Argos CI for visual comparison
- Custom pixel matching for critical components

## Debugging Tests

1. **Run in headed mode:**
   ```bash
   HEADLESS=false npm run test:e2e
   ```

2. **Enable debug logging:**
   ```bash
   DEBUG=true npm run test:e2e
   ```

3. **Use Playwright Inspector:**
   ```bash
   npm run test:e2e:debug
   ```

4. **View test reports:**
   ```bash
   npx playwright show-report
   ```

## Writing New Tests

1. **E2E Test Template:**
   ```typescript
   import { test, expect } from '@playwright/test';
   import { PipelineE2ETest } from '../framework/pipeline-test-base';

   class MyTest extends PipelineE2ETest {
     // Implementation
   }

   test.describe('My Feature', () => {
     // Tests
   });
   ```

2. **Best Practices:**
   - Use data-testid attributes for element selection
   - Implement proper cleanup in afterEach hooks
   - Use meaningful test descriptions
   - Group related tests in describe blocks
   - Handle async operations properly

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   lsof -ti:3000 | xargs kill
   ```

2. **Database connection issues:**
   ```bash
   npm run db:test:prepare
   ```

3. **Flaky tests:**
   - Increase timeouts
   - Add proper wait conditions
   - Check for race conditions

## Metrics and Reporting

Test results are available in:
- `test-results/` - Raw test results
- `playwright-report/` - HTML reports
- `performance-reports/` - Performance metrics
- `coverage/` - Code coverage reports

## Contributing

1. Write tests for new features
2. Ensure all tests pass locally
3. Update documentation
4. Submit PR with test results

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Jest Documentation](https://jestjs.io)
- [Testing Best Practices](./docs/testing-best-practices.md)