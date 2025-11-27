import React, { createContext, useContext, useState, useCallback } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const startLoading = useCallback((message = 'Loading...') => {
    setLoadingMessage(message);
    setLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setLoading(false);
    setLoadingMessage('Loading...');
  }, []);

  const withLoading = useCallback(async (asyncFn, message = 'Loading...') => {
    try {
      startLoading(message);
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return (
    <LoadingContext.Provider
      value={{
        loading,
        loadingMessage,
        startLoading,
        stopLoading,
        withLoading,
      }}
    >
      {children}
      {loading && <LoadingOverlay message={loadingMessage} />}
    </LoadingContext.Provider>
  );
}

// Custom hook to use loading
export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

