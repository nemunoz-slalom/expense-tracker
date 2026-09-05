const path = require('path');

const sourceDirectory = path.resolve(__dirname, 'src');

module.exports = {
  jest: {
    configure: {
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  },
  webpack: {
    alias: {
      '@': sourceDirectory,
    },
  },
};
