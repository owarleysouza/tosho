import { useEffect, useState } from 'react';

// How much of the layout viewport's bottom edge is currently obscured —
// by the on-screen keyboard, most commonly. Mobile browsers shrink
// `window.visualViewport` (and/or offset it) when the keyboard opens
// without touching `window.innerHeight`, so a `position: fixed; bottom: 0`
// element has no native way to react — it stays pinned to the bottom of
// the full, keyboard-unaware layout viewport, ending up hidden behind the
// keyboard. 0 when nothing is obscuring (desktop, keyboard closed, etc).
export function useVisualViewportInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    function updateInset() {
      const nextInset = window.innerHeight - viewport!.height - viewport!.offsetTop;
      setInset(Math.max(0, Math.round(nextInset)));
    }

    updateInset();
    viewport.addEventListener('resize', updateInset);
    viewport.addEventListener('scroll', updateInset);
    return () => {
      viewport.removeEventListener('resize', updateInset);
      viewport.removeEventListener('scroll', updateInset);
    };
  }, []);

  return inset;
}
