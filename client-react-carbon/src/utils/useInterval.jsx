/**
 * Credit https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 * Found through:
 *   https://blog.bitsrc.io/polling-in-react-using-the-useinterval-custom-hook-e2bcefda4197
 */
import { useEffect, useRef } from "react";

export function useInterval(callback, delay) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval (and run it initially, too)
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    savedCallback.current();
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
