import { afterEach, describe, expect, it, vi } from 'vitest';
import { getHealthQueryKey } from '@/api/@tanstack/react-query.gen';
import { act, FakeEventSource, renderHook } from '@/test-utils';
import { healthFixture } from '@/test-utils/handlers';
import { EVENT_STREAM_URL, useEventStream } from './useEventStream';

describe('useEventStream', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('goes live and writes each health event into the health query', () => {
    const { result, client } = renderHook(() => useEventStream());
    const source = FakeEventSource.latest();

    expect(source.url).toBe(EVENT_STREAM_URL);
    expect(result.current).toBe('connecting');

    act(() => source.emit('health', healthFixture));

    expect(result.current).toBe('live');
    expect(client.getQueryData(getHealthQueryKey())).toEqual(healthFixture);
  });

  it('ignores an event that does not match the spec', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result, client } = renderHook(() => useEventStream());

    act(() => FakeEventSource.latest().emit('health', { status: 'exploded' }));

    expect(result.current).toBe('connecting');
    expect(client.getQueryData(getHealthQueryKey())).toBeUndefined();
    expect(logged).toHaveBeenCalledOnce();
  });

  it('reconnects with backoff after the stream drops', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useEventStream());
    const first = FakeEventSource.latest();

    act(() => first.fail());

    expect(result.current).toBe('reconnecting');
    expect(first.closed).toBe(true);
    expect(FakeEventSource.instances).toHaveLength(1);

    act(() => vi.advanceTimersByTime(1000));

    expect(FakeEventSource.instances).toHaveLength(2);

    act(() => FakeEventSource.latest().emit('health', healthFixture));

    expect(result.current).toBe('live');
  });

  it('closes the stream on unmount', () => {
    const { unmount } = renderHook(() => useEventStream());
    const source = FakeEventSource.latest();

    unmount();

    expect(source.closed).toBe(true);
  });
});
