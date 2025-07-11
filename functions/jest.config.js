module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/test/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/test/**',
    '!src/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  testTimeout: 30000
};
