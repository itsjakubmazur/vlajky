'use client';

import { useEffect } from 'react';
import { useProgress } from '@/store/StoreProvider';

/**
 * Přenese vybraný vzhled na kořenový prvek. Zbytek řeší CSS – žádné
 * přepočítávání barev v JavaScriptu.
 */
export function ThemeApplier() {
  const { progress } = useProgress();
  const { theme, frame } = progress.meta;

  useEffect(() => {
    document.documentElement.dataset.appTheme = theme;
    document.documentElement.dataset.appFrame = frame;
  }, [theme, frame]);

  return null;
}
