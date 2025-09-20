import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentLanguage, setCurrentLanguage } from '../utils/translations';

const AppContext = createContext({
  currentUser: null,
  onLogin: () => {},
  onLogout: () => {},
  backendUrl: '',
  currentLanguage: 'en',
  setLanguage: () => {},
});

export const AppProvider = ({ children, value }) => {
  const [currentLanguage, setCurrentLanguageState] = useState(getCurrentLanguage());

  const setLanguage = (language) => {
    setCurrentLanguage(language);
    setCurrentLanguageState(language);
    // Force re-render by updating a dummy state
    window.location.reload();
  };

  const contextValue = {
    ...value,
    currentLanguage,
    setLanguage,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export default AppContext;