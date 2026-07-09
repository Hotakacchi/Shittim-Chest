import { useEffect, useState } from 'react';

const GLITCH_CHARS = '/^¬↓♥⊳×∴⧗⌐░▒▓' as const;

export function useGlitchText(source: string, active: boolean): string {
  const [display, setDisplay] = useState(source);

  useEffect(() => {
    if (!active) {
      setDisplay(source);
      return;
    }
    const id = setInterval(() => {
      const chars = source.split('').map((ch) => {
        if (ch === ' ') return ch;
        return Math.random() < 0.08
          ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
          : ch;
      });
      setDisplay(chars.join(''));
    }, 130);
    return () => clearInterval(id);
  }, [source, active]);

  return display;
}
