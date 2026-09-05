import { act, renderHook } from '@testing-library/react';

import { useUndoTimer } from '../src/hooks/useUndoTimer';

describe('useUndoTimer', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('keeps windows independent and notifies each service once after expiry', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { result } = renderHook(() => useUndoTimer());

    act(() => {
      result.current.start(1, first);
      result.current.start(2, second);
      jest.advanceTimersByTime(8_000);
    });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(result.current.activeTimers).toEqual([]);
    act(() => jest.advanceTimersByTime(8_000));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('cancels an individual window without affecting other active windows', () => {
    const cancelled = jest.fn();
    const active = jest.fn();
    const { result } = renderHook(() => useUndoTimer());

    act(() => {
      result.current.start(1, cancelled);
      result.current.start(2, active);
      result.current.cancel(1);
      jest.advanceTimersByTime(8_000);
    });

    expect(cancelled).not.toHaveBeenCalled();
    expect(active).toHaveBeenCalledTimes(1);
  });

  it('clears outstanding timer handles on teardown', () => {
    const onExpire = jest.fn();
    const { result, unmount } = renderHook(() => useUndoTimer());
    act(() => result.current.start(1, onExpire));
    unmount();
    act(() => jest.advanceTimersByTime(8_000));
    expect(onExpire).not.toHaveBeenCalled();
  });
});
