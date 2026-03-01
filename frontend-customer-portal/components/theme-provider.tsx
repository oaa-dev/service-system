'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useThemeStore } from '@/stores/themeStore';
import { useEffect, ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { color } = useThemeStore();

  // Apply color theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme attributes
    root.removeAttribute('data-theme');

    // Apply new theme if not default (zinc)
    if (color !== 'zinc') {
      root.setAttribute('data-theme', color);
    }
  }, [color]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
