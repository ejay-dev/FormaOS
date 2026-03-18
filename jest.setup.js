// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// React 19 compatibility: patch React.act before testing-library loads
// React 19 moved act to 'react' but testing-library may still look for it via react-dom/test-utils
import * as React from 'react';

// Check if we're on React 19+ where act is directly on React
if (typeof React.act === 'undefined') {
  // For React 19, act should be imported from 'react' directly
  // But if it's missing, we need to patch it
  try {
    const { act } = require('react');
    if (act) {
      React.act = act;
    }
  } catch {
    // Fallback: create a minimal act implementation
    React.act = (callback) => {
      const result = callback();
      if (result && typeof result.then === 'function') {
        return result;
      }
      return Promise.resolve(result);
    };
  }
}

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Zustand store
jest.mock('@/lib/stores/app', () => ({
  useAppStore: jest.fn(() => ({
    user: null,
    organization: null,
    role: null,
    setUser: jest.fn(),
    setOrganization: jest.fn(),
    setRole: jest.fn(),
  })),
  useOrgId: jest.fn(() => null),
}));

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          maybeSingle: jest.fn(),
        })),
      })),
    })),
  })),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Ensure TextEncoder/TextDecoder are available for crypto helpers
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Increase timeout for async tests
jest.setTimeout(10000);

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock fetch for API tests
global.fetch = jest.fn();

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const React = require('react');

  // Filter out framer-motion specific props that aren't valid DOM attributes
  const filterMotionProps = (props) => {
    const motionProps = [
      'initial',
      'animate',
      'exit',
      'transition',
      'variants',
      'whileHover',
      'whileTap',
      'whileFocus',
      'whileInView',
      'whileDrag',
      'layout',
      'layoutId',
      'onAnimationStart',
      'onAnimationComplete',
      'onViewportEnter',
      'onViewportLeave',
      'viewport',
      'drag',
      'dragConstraints',
      'dragElastic',
      'dragMomentum',
      'dragTransition',
      'dragPropagation',
    ];
    const filtered = {};
    Object.keys(props).forEach((key) => {
      if (!motionProps.includes(key)) {
        filtered[key] = props[key];
      }
    });
    return filtered;
  };

  const createMotionComponent = (tag) =>
    React.forwardRef(({ children, ...props }, ref) =>
      React.createElement(tag, { ...filterMotionProps(props), ref }, children),
    );

  return {
    motion: {
      div: createMotionComponent('div'),
      span: createMotionComponent('span'),
      button: createMotionComponent('button'),
      a: createMotionComponent('a'),
      ul: createMotionComponent('ul'),
      li: createMotionComponent('li'),
      section: createMotionComponent('section'),
      article: createMotionComponent('article'),
      header: createMotionComponent('header'),
      footer: createMotionComponent('footer'),
      nav: createMotionComponent('nav'),
      main: createMotionComponent('main'),
      p: createMotionComponent('p'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
      h4: createMotionComponent('h4'),
      h5: createMotionComponent('h5'),
      h6: createMotionComponent('h6'),
      img: createMotionComponent('img'),
      svg: createMotionComponent('svg'),
      path: createMotionComponent('path'),
    },
    AnimatePresence: ({ children }) => children,
    useMotionValue: () => ({ set: jest.fn(), get: jest.fn(() => 0) }),
    useTransform: () => ({ set: jest.fn(), get: jest.fn(() => 0) }),
    useSpring: () => ({ set: jest.fn(), get: jest.fn(() => 0) }),
    useAnimation: () => ({
      start: jest.fn(),
      stop: jest.fn(),
    }),
    useInView: () => true,
    useScroll: () => ({ scrollY: { get: jest.fn(() => 0) } }),
  };
});

// Mock performance monitor
jest.mock('@/lib/monitoring/performance-monitor', () => ({
  trackCustomMetric: jest.fn(),
  CUSTOM_METRICS: {
    CHECKLIST_LOAD: 'checklist_load',
    ROADMAP_RENDER: 'roadmap_render',
    FRAMEWORK_PROVISION: 'framework_provision',
    CACHE_HIT_RATE: 'cache_hit_rate',
    API_LATENCY: 'api_latency',
    INDUSTRY_LOAD: 'industry_load',
  },
}));
