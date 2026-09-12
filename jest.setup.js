// Runs before the test framework is installed, so process.env is ready before any module
// under test (like lib/api/client.ts) reads it at import time.
process.env.EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.test.local/v1';

// Jest's node test environment doesn't reliably expose the runtime's built-in fetch/Headers
// globals, which lib/api/client.ts relies on — polyfill from undici if they're missing.
if (typeof global.fetch === 'undefined') {
  const undici = require('undici');
  global.fetch = undici.fetch;
  global.Headers = undici.Headers;
  global.Request = undici.Request;
  global.Response = undici.Response;
}

// react-query's focus/online managers register real window/document event listeners by
// default, which have nothing to attach to under Jest and otherwise leave the process
// hanging after the test run finishes ("Jest did not exit..."). No-op them in tests.
const { onlineManager, focusManager } = require('@tanstack/react-query');
onlineManager.setEventListener(() => () => {});
focusManager.setEventListener(() => () => {});
