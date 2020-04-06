module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/', 'src/database', 'src/config'],
  moduleNameMapper: {
    '^@src(.*)$': '<rootDir>/src$1',
    '^@mocks(.*)$': '<rootDir>/mocks$1',
  },
  resetMocks: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
