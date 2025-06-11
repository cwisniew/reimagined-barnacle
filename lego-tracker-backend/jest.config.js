// lego-tracker-backend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'], // Pattern for test files
  moduleNameMapper: { // If you use path aliases in tsconfig, map them here
    // Example: '^@App/(.*)$': '<rootDir>/src/$1'
  },
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // Setup files after env is setup but before test code
  // setupFilesAfterEnv: ['./jest.setup.js'], // Optional: for global test setup like DB seeding for tests
};
