module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@dealership/shared(.*)$': '<rootDir>/../shared/src$1'
  }
};
