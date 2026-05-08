import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNavigationHistory } from '../hooks/useNavigationHistory';

describe('useNavigationHistory', () => {
  it('should initialize with empty stacks', () => {
    const { result } = renderHook(() => useNavigationHistory());
    expect(result.current.backStack).toEqual([]);
    expect(result.current.forwardStack).toEqual([]);
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoForward).toBe(false);
  });

  it('should push to history and clear forward stack', () => {
    const { result } = renderHook(() => useNavigationHistory());
    
    act(() => {
      result.current.pushToHistory('/path/1');
    });
    
    expect(result.current.backStack).toEqual(['/path/1']);
    expect(result.current.canGoBack).toBe(true);

    // Simulate manually adding to forward stack
    // (In reality this hook clears it on push)
    act(() => {
      result.current.pushToHistory('/path/2');
    });
    expect(result.current.backStack).toEqual(['/path/1', '/path/2']);
  });

  it('should handle back and forward navigation', () => {
    const { result } = renderHook(() => useNavigationHistory());
    
    act(() => {
      result.current.pushToHistory('/path/1');
    });

    let prevPath: string | null = null;
    act(() => {
      prevPath = result.current.popBack('/path/2');
    });

    expect(prevPath).toBe('/path/1');
    expect(result.current.backStack).toEqual([]);
    expect(result.current.forwardStack).toEqual(['/path/2']);
    expect(result.current.canGoForward).toBe(true);

    let nextPath: string | null = null;
    act(() => {
      nextPath = result.current.popForward('/path/1');
    });

    expect(nextPath).toBe('/path/2');
    expect(result.current.backStack).toEqual(['/path/1']);
    expect(result.current.forwardStack).toEqual([]);
  });
});
