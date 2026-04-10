/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  moduleNameMapper: {
    '^@coderabbit-test/shared-services$': '<rootDir>/packages/shared-services/src/index.ts',
    // Ensure 'zod' always resolves to node_modules, not the local zod.ts file
    '^zod$': '<rootDir>/node_modules/zod',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },
  testPathIgnorePatterns: ['/node_modules/'],
};