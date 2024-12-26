import {
  DependencyList,
  EffectCallback,
  useCallback,
  useEffect,
  useRef
} from 'react';

interface UseDebounceEffectOptions {
  delay?: number;
  immediate?: boolean;
}

/**
 * A debounced version of useEffect that allows cleanup functions
 * @param effect - Effect callback that can return a cleanup function
 * @param deps - Dependency array
 * @param options - Configuration options
 * @param options.delay - Debounce delay in milliseconds (default: 300)
 * @param options.immediate - Whether to run the effect immediately on first render (default: false)
 */
export function useDebounceEffect<T extends DependencyList>(
  effect: EffectCallback,
  deps: T,
  options: UseDebounceEffectOptions = {}
): void {
  const { delay = 300, immediate = false } = options;

  const effectRef = useRef<EffectCallback>(effect);
  const cleanupRef = useRef<void | (() => void)>();
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    effectRef.current = effect;
  }, [effect]);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      cleanup();
      cleanupRef.current = effectRef.current();
      return;
    }

    timerRef.current = setTimeout(() => {
      cleanup();
      cleanupRef.current = effectRef.current();
    }, delay);

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
