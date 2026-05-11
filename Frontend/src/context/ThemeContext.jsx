import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // Default to dark
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const theme = {
    isDark,
    toggleTheme,
    colors: isDark ? {
      // Dark theme (current)
      bg: '#0f172a',
      bgSecondary: '#1e293b',
      bgTertiary: '#334155',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      textTertiary: '#64748b',
      primary: '#3b82f6',
      primaryDark: '#1e40af',
      border: '#334155',
      success: '#22c55e',
      successBg: '#052e16',
      error: '#ef4444',
      errorBg: '#450a0a',
      hover: '#1e3a5f',
    } : {
      // Light theme (inverted)
      bg: '#ffffff',
      bgSecondary: '#f8fafc',
      bgTertiary: '#e2e8f0',
      text: '#0f172a',
      textSecondary: '#475569',
      textTertiary: '#64748b',
      primary: '#3b82f6',
      primaryDark: '#1e40af',
      border: '#cbd5e1',
      success: '#22c55e',
      successBg: '#dcfce7',
      error: '#ef4444',
      errorBg: '#fee2e2',
      hover: '#e0f2fe',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
