import React, { createContext, useContext, useState } from 'react';

const WorkerContext = createContext(undefined);

export const WorkerProvider = ({ children }) => {
  const [tokens, setTokens] = useState(null);

  const setAuthTokens = (newTokens) => {
    setTokens(newTokens);
  };

  const logout = () => {
    setTokens(null);
  };

  // Automatically injects the bearer token into outgoing API calls
  const authenticatedFetch = async (url, options = {}) => {
    if (!tokens?.access_token) {
      throw new Error('No access token available. User is unauthenticated.');
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${tokens.access_token}`);

    return fetch(url, { ...options, headers });
  };

  const isAuthenticated = !!tokens?.access_token;

  return (
    <WorkerContext.Provider value={{ isAuthenticated, tokens, setAuthTokens, logout, authenticatedFetch }}>
      {children}
    </WorkerContext.Provider>
  );
};

export const useWorkerAuth = () => {
  const context = useContext(WorkerContext);
  if (!context) {
    throw new Error('useWorkerAuth must be used within a WorkerProvider');
  }
  return context;
};