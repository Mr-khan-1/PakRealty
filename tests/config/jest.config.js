export default {
  rootDir: '../../',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/config/testSetup.js'],
  transform: {},
  moduleNameMapper: {
    '^mongoose$': '<rootDir>/backend/node_modules/mongoose/index.js',
    '^bcryptjs$': '<rootDir>/backend/node_modules/bcryptjs/index.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/frontend/',
    '/backend/node_modules/'
  ],
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/node_modules/**',
    '!backend/server.js',
    '!backend/scripts/**'
  ],
  coverageDirectory: '<rootDir>/tests/reports/coverage',
  coverageReporters: ['json', 'html', 'text', 'text-summary'],
  // Coverage thresholds - increase once all tests are passing
  // coverageThreshold: { global: { branches: 80, functions: 80, lines: 80, statements: 80 } },
  // Critical: high timeout so mongodb-memory-server has time to boot
  testTimeout: 60000,
  // Run all tests serially in one process (no parallel DB race conditions)
  maxWorkers: 1,
};
