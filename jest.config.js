/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  // Something in the RN/Expo test environment (observed even with react-query's
  // focus/online listeners disabled) leaves a handle open after all suites finish,
  // which otherwise hangs the process indefinitely instead of just exiting non-zero.
  forceExit: true,
};
