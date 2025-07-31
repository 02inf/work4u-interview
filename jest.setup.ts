import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
}));

// Mock environment variables
process.env.DATABASE_URL = 'file:./test.db';
process.env.USE_MOCK_RESPONSES = 'true';

// Global test utilities
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Mock fetch for tests
global.fetch = jest.fn();

// Mock ReadableStream for Server-Sent Events tests
global.ReadableStream = jest.fn().mockImplementation(() => ({
  getReader: jest.fn(() => ({
    read: jest.fn(),
    releaseLock: jest.fn(),
  })),
})) as any;

// Mock EventSource for client-side SSE tests
global.EventSource = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  readyState: 1,
})) as any;

// Mock Request and Response for API tests
(global as any).Request = class Request {
  constructor(public url: string, public init?: RequestInit) {}
  headers = new Map();
  method = 'GET';
  body = null;
};

(global as any).Response = class Response {
  constructor(public body: any, public init?: ResponseInit) {}
  status = 200;
  ok = true;
  headers = new Map();
  json() {
    return Promise.resolve(this.body);
  }
  text() {
    return Promise.resolve(String(this.body));
  }
};
