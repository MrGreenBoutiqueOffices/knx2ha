/** @type {import('jest').Config} */
module.exports = {
  collectCoverage: true,
  coverageReporters: ['json', 'text'],
  collectCoverageFrom: ['<rootDir>/src/lib/knx/**/*.{ts,tsx}'],
  coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/'],
  transformIgnorePatterns: ['/node_modules/(?!chalk).+\\.js$'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/lib/knx/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
        isolatedModules: false,
      },
    ],
  },
};
