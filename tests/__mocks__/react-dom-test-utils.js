/**
 * React 19 compatibility mock for react-dom/test-utils
 *
 * React 19 deprecated react-dom/test-utils and moved act to the 'react' package.
 * This mock provides the act function from the correct location.
 */

const React = require('react');

// In React 19, act is exported directly from 'react'
const act = React.act || ((callback) => {
  const result = callback();
  if (result && typeof result.then === 'function') {
    return result;
  }
  return Promise.resolve(result);
});

module.exports = {
  act,
  // These are also deprecated but may be referenced
  unstable_batchedUpdates: (callback) => callback(),
};
