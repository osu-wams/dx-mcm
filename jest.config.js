module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@src(.*)$': '<rootDir>/src$1',
    '^@mocks(.*)$': '<rootDir>/mocks$1',
  },
};
