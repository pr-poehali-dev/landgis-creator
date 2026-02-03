import { useEffect } from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useAppSettings();

  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.bgColor) {
      const bgRgb = hexToRgb(settings.bgColor);
      root.style.setProperty('--background', bgRgb);
    }
    
    if (settings.buttonColor) {
      const btnRgb = hexToRgb(settings.buttonColor);
      root.style.setProperty('--primary', btnRgb);
    }
  }, [settings]);

  return <>{children}</>;
};

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0 0';
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `${r} ${g} ${b}`;
}
