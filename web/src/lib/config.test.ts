import { afterEach, describe, expect, it, vi } from 'vitest';
import { getConfigQueryKey } from '@/api/@tanstack/react-query.gen';
import { configFixture } from '@/test-utils/handlers';
import { getInjectedConfig } from './config';
import { createQueryClient } from './query-client';

describe('getInjectedConfig', () => {
  afterEach(() => {
    delete window.__CONFIG__;
  });

  it('returns the injected configuration when it matches the spec', () => {
    window.__CONFIG__ = configFixture;
    expect(getInjectedConfig()).toEqual(configFixture);
  });

  it('is undefined without an injection', () => {
    expect(getInjectedConfig()).toBeUndefined();
  });

  it('rejects an injection that does not match the spec', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.__CONFIG__ = { name: 42 };

    expect(getInjectedConfig()).toBeUndefined();
    expect(logged).toHaveBeenCalledOnce();
  });
});

describe('createQueryClient', () => {
  it('seeds the config query from the injection', () => {
    expect(createQueryClient(configFixture).getQueryData(getConfigQueryKey())).toEqual(configFixture);
    expect(createQueryClient(undefined).getQueryData(getConfigQueryKey())).toBeUndefined();
  });
});
