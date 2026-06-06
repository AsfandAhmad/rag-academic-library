import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mkTheme') || 'dark';
  });
  const [textScale, setTextScale] = useState(() => {
    return Number(localStorage.getItem('mkTextScale') || 0);
  });
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('mkHighContrast') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('mkTheme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    const normalizedScale = Math.max(-1, Math.min(2, textScale));
    const zoom = (1 + normalizedScale * 0.08).toFixed(2);

    localStorage.setItem('mkTextScale', String(normalizedScale));
    document.documentElement.style.setProperty('--mk-text-zoom', zoom);
  }, [textScale]);

  useEffect(() => {
    localStorage.setItem('mkHighContrast', String(highContrast));
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const increaseText = () => setTextScale(prev => Math.min(2, prev + 1));
  const decreaseText = () => setTextScale(prev => Math.max(-1, prev - 1));
  const resetAccessibility = () => {
    setTextScale(0);
    setHighContrast(false);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        textScale,
        increaseText,
        decreaseText,
        highContrast,
        setHighContrast,
        resetAccessibility,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
