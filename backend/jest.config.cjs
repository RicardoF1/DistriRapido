module.exports = {
  preset: 'ts-jest', testEnvironment: 'node', testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/**/*.module.ts'],
  coverageThreshold: { global: { statements: 80, branches: 80, functions: 80, lines: 80 } },
  coverageReporters: ['text', 'json-summary', 'lcov'],
};
