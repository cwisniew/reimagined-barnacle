module.exports = {
  // Attempt to be more explicit, though 'jest-environment-jsdom' should suffice
  testEnvironment: 'node_modules/jest-environment-jsdom/build/index.js',
  moduleFileExtensions: [
    'js',
    'json',
    'vue'
  ],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.js$': 'babel-jest' // Make sure babel-jest is configured if you use ES6 in JS files
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: [ // Override default testMatch to look in tests/unit
    '<rootDir>/tests/unit/**/*.spec.js'
  ],
  // If using babel-jest and you have babel.config.js, it should be picked up.
  // If not, you might need to specify babel config here or ensure babel-jest is correctly installed and configured.
  // The @vue/vue3-jest preset already includes babel-jest for vue component script blocks.
};
