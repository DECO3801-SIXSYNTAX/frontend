const nextJest = require('next/jest');

// kasih tau jest dimana letak project Next.js kamu
const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironment: 'jsdom',
};

module.exports = createJestConfig(customJestConfig);
