import { useState, useCallback, useMemo } from "react";

export function useNavigationHistory() {
  const [backStack, setBackStack] = useState<string[]>([]);
  const [forwardStack, setForwardStack] = useState<string[]>([]);

  const pushToHistory = useCallback((path: string) => {
    setBackStack(prev => [...prev, path]);
    setForwardStack([]);
  }, []);

  const popBack = useCallback((currentPath: string) => {
    if (backStack.length === 0) return null;
    const previous = backStack[backStack.length - 1];
    setBackStack(prev => prev.slice(0, -1));
    if (currentPath) {
      setForwardStack(prev => [...prev, currentPath]);
    }
    return previous;
  }, [backStack]);

  const popForward = useCallback((currentPath: string) => {
    if (forwardStack.length === 0) return null;
    const next = forwardStack[forwardStack.length - 1];
    setForwardStack(prev => prev.slice(0, -1));
    if (currentPath) {
      setBackStack(prev => [...prev, currentPath]);
    }
    return next;
  }, [forwardStack]);

  return useMemo(() => ({
    backStack,
    forwardStack,
    canGoBack: backStack.length > 0,
    canGoForward: forwardStack.length > 0,
    pushToHistory,
    popBack,
    popForward
  }), [backStack, forwardStack, pushToHistory, popBack, popForward]);
}
