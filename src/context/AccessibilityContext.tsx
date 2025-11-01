import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AccessibilityContextType {
  largeFonts: boolean;
  highContrast: boolean;
  toggleLargeFonts: () => void;
  toggleHighContrast: () => void;
  getFontSize: (base: number) => number;
  getColor: (normal: string, contrast: string) => string;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [largeFonts, setLargeFonts] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const toggleLargeFonts = () => setLargeFonts(!largeFonts);
  const toggleHighContrast = () => setHighContrast(!highContrast);
  
  const getFontSize = (base: number) => largeFonts ? base * 1.2 : base;
  const getColor = (normal: string, contrast: string) => highContrast ? contrast : normal;

  return (
    <AccessibilityContext.Provider
      value={{ largeFonts, highContrast, toggleLargeFonts, toggleHighContrast, getFontSize, getColor }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return context;
};