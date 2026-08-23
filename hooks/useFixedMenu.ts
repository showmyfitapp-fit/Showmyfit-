'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function getFixedMenuStyle(button: HTMLElement | null): React.CSSProperties {
  if (!button || typeof window === 'undefined') return {};

  const rect = button.getBoundingClientRect();
  const gap = 4;
  const maxH = 240;
  const spaceBelow = window.innerHeight - rect.bottom - gap;
  const spaceAbove = rect.top - gap;
  const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;

  return {
    position: 'absolute',
    left: 0,
    width: '100%',
    zIndex: 100,
    maxHeight: Math.min(maxH, Math.max(120, openUp ? spaceAbove : spaceBelow)),
    ...(openUp
      ? { bottom: '100%', marginBottom: gap }
      : { top: '100%', marginTop: gap }),
  };
}

export function useFixedMenu(open: boolean, onClose: () => void) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const sync = useCallback(() => {
    setMenuStyle(getFixedMenuStyle(triggerRef.current));
  }, []);

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    if (!open) return;

    const onReposition = () => sync();
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        onClose();
      }
    };

    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);

    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open, onClose, sync]);

  return { rootRef, triggerRef, menuStyle, sync };
}
