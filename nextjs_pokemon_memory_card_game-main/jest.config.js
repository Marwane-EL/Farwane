module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleDirectories: ['node_modules', 'src', 'test-utils'],
  testEnvironment: 'jsdom',
  // Same as 'tsconfig.json'
  moduleNameMapper: {
    '@components/(.*)': '<rootDir>/components/$1',
    '@utils/(.*)': '<rootDir>/utils/$1',
    '@lib/(.*)': '<rootDir>/lib/$1',
    '@services/(.*)': '<rootDir>/services/$1',
    '@types/(.*)': '<rootDir>/types/$1',
  },
};
