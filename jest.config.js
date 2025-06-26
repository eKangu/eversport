module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/'],
    testMatch: [
        '**/__tests__/**/*.test.(ts|js)',
        '**/*.(test|spec).(ts|js)'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/__tests__/utils/'
    ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
