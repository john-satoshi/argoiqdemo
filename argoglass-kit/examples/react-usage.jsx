import { useEffect, useRef } from 'react';
import { applyArgoGlass } from '../src/index.js';

export function ArgoGlassCard({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    applyArgoGlass(ref.current, { presetName: 'ArgoGlass-Base' });
  }, []);

  return (
    <div ref={ref} className="argoglass-surface">
      {children}
    </div>
  );
}
