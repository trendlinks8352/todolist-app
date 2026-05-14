'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  setupFiles: ['./test/helpers/envSetup.js'],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
};
