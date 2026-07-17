/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/utils/intlPolyfill$': '<rootDir>/utils/intlPolyfill.mock.ts',
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        strict: true,
        esModuleInterop: true,
        paths: {
          '@/*': ['./*'],
        },
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(firebase|@firebase)/)',
  ],
  testMatch: ['**/*.test.(ts|tsx)', '**/*.test.ts', '**/*.test.tsx'],
}
