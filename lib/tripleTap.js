import { useRef } from 'react';

// Returns an onPress handler: fires `onTriple` after 3 taps within `window` ms.
export function useTripleTap(onTriple, { window = 600, requiredTaps = 3 } = {}) {
  const tapsRef = useRef([]);
  return () => {
    const now = Date.now();
    tapsRef.current = [...tapsRef.current.filter((t) => now - t < window), now];
    if (tapsRef.current.length >= requiredTaps) {
      tapsRef.current = [];
      onTriple();
    }
  };
}
