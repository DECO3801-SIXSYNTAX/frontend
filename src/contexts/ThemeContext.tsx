import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface ThemeSettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
  compactMode: boolean;
}

interface ThemeContextType {
  settings: ThemeSettings;
  updateSettings: (newSettings: Partial<ThemeSettings>) => void;
  isDark: boolean;
  resetToDefaults: () => void;
}

const defaultSettings: ThemeSettings = {
  theme: 'light',
  primaryColor: 'indigo',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
  compactMode: false,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('themeSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Failed to parse theme settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Determine if dark mode should be active
    let shouldBeDark = false;

    if (settings.theme === 'dark') {
      shouldBeDark = true;
    } else if (settings.theme === 'system') {
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDark(shouldBeDark);

    // Apply theme classes to document
    const root = document.documentElement;

    // Theme class
    root.classList.remove('light', 'dark');
    root.classList.add(shouldBeDark ? 'dark' : 'light');

    // Primary color CSS variables
    const colorMap = {
      indigo: {
        50: shouldBeDark ? '#1e1b4b' : '#eef2ff',
        100: shouldBeDark ? '#312e81' : '#e0e7ff',
        500: shouldBeDark ? '#8b5cf6' : '#6366f1',
        600: shouldBeDark ? '#7c3aed' : '#4f46e5',
        700: shouldBeDark ? '#6d28d9' : '#4338ca',
      },
      blue: {
        50: shouldBeDark ? '#0c1e3e' : '#eff6ff',
        100: shouldBeDark ? '#1e3a8a' : '#dbeafe',
        500: shouldBeDark ? '#60a5fa' : '#3b82f6',
        600: shouldBeDark ? '#3b82f6' : '#2563eb',
        700: shouldBeDark ? '#2563eb' : '#1d4ed8',
      },
      green: {
        50: shouldBeDark ? '#052e16' : '#f0fdf4',
        100: shouldBeDark ? '#14532d' : '#dcfce7',
        500: shouldBeDark ? '#4ade80' : '#22c55e',
        600: shouldBeDark ? '#22c55e' : '#16a34a',
        700: shouldBeDark ? '#16a34a' : '#15803d',
      },
      purple: {
        50: shouldBeDark ? '#2d1b69' : '#faf5ff',
        100: shouldBeDark ? '#4c1d95' : '#f3e8ff',
        500: shouldBeDark ? '#a855f7' : '#a855f7',
        600: shouldBeDark ? '#9333ea' : '#9333ea',
        700: shouldBeDark ? '#7c2d12' : '#7c2d12',
      },
    };

    const colors = colorMap[settings.primaryColor as keyof typeof colorMap] || colorMap.indigo;
    root.style.setProperty('--primary-50', colors[50]);
    root.style.setProperty('--primary-100', colors[100]);
    root.style.setProperty('--primary-500', colors[500]);
    root.style.setProperty('--primary-600', colors[600]);
    root.style.setProperty('--primary-700', colors[700]);

    // Font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Compact mode
    if (settings.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }

  }, [settings]);

  const updateSettings = (newSettings: Partial<ThemeSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('themeSettings', JSON.stringify(updatedSettings));

    // Note: Theme settings are persisted in localStorage only
    // For cloud sync, use the SettingsService in AppSettings page
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    localStorage.setItem('themeSettings', JSON.stringify(defaultSettings));
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, isDark, resetToDefaults }}>
      {children}
    </ThemeContext.Provider>
  );
};