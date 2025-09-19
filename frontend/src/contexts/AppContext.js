import React, { createContext, useContext } from 'react';

const AppContext = createContext({
  currentUser: null,
  onLogin: () => {},
  onLogout: () => {},
  backendUrl: '',
});

export const AppProvider = ({ children, value }) => {
  return (
    <AppContext.Provider value={value}>
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