module.exports = {
    transform: {
      '^.+\\.js$': 'babel-jest',
      '^.+\\.mjs$': 'babel-jest', // If you're using .mjs files
    },
    transformIgnorePatterns: [
      'node_modules/(?!(your-specific-module)/)'
    ],
    moduleFileExtensions: ['js', 'json', 'node', 'mjs'],
    testEnvironment: 'jsdom',
  };