module.exports = {
    transform: {
      '^.+\\.js$': 'babel-jest',
    },
    transformIgnorePatterns: [
      "/node_modules/(?!(@open-wc|@lit|lit|@esm-bundle)).+\\.js$"
    ],
    moduleFileExtensions: ['js', 'json'],
    testEnvironment: 'jsdom',
  };