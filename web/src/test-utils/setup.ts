import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { FakeEventSource } from './event-source';
import { server } from './server';

// A request no test mocked is a defect, not a silent network call.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

beforeEach(() => {
  FakeEventSource.instances = [];
  vi.stubGlobal('EventSource', FakeEventSource);
  // jsdom does not implement scrolling; the router restores scroll positions.
  vi.stubGlobal('scrollTo', vi.fn());
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});
