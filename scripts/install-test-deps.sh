#!/bin/bash

echo "Installing E2E test dependencies..."

# Core testing dependencies
npm install --save-dev \
  @faker-js/faker \
  @argos-ci/playwright \
  pixelmatch \
  pngjs \
  socket.io-client \
  jest \
  @jest/globals \
  @types/jest \
  ts-jest \
  wait-on \
  lighthouse \
  chrome-launcher

# Additional types
npm install --save-dev \
  @types/pixelmatch \
  @types/pngjs

echo "Test dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run test:e2e' to run E2E tests"
echo "2. Run 'npm run test:e2e:ui' to run tests with UI mode"
echo "3. Run 'npm run test:integration' to run integration tests"
echo "4. Run 'npm run test:performance' to run performance tests"
echo "5. Run 'npm run test:visual' to run visual regression tests"