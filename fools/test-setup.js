/**
 * Test setup: patches z.urls() which is missing from Zod 4.x
 * Load with: tsx --require ./test-setup.js
 */
const zodLib = require('zod');
if (typeof zodLib.z.urls !== 'function') {
  zodLib.z.urls = () => zodLib.z.array(zodLib.z.url());
}