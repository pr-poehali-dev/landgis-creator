import { useEffect } from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useAppSettings();

  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.bgColor) {
      const cleanHex = normalizeHex(settings.bgColor);
      const bgRgb = hexToRgb(cleanHex);
      root.style.setProperty('--background', bgRgb);
    }
    
    if (settings.buttonColor) {
      const cleanHex = normalizeHex(settings.buttonColor);
      const btnRgb = hexToRgb(cleanHex);
      root.style.setProperty('--primary', btnRgb);
    }
  }, [settings]);

  return <>{children}</>;
};

function normalizeHex(hex: string): string {
  let clean = hex.replace(/[^a-f0-9#]/gi, '');
  if (!clean.startsWith('#')) clean = '#' + clean;
  if (clean.length > 7) clean = clean.substring(0, 7);
  if (clean.length === 7) clean = clean.substring(0, 7);
  return clean;
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    console.warn('Invalid hex color:', hex);
    return '0 0 0';
  }
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `${r} ${g} ${b}`;
}