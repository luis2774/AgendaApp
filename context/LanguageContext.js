import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext(null);

const LANGUAGE_STORAGE_KEY = '@app_language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('english');

  // Load saved language preference on mount
  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const changeLanguage = async (newLanguage) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'english' ? 'spanish' : 'english';
    changeLanguage(newLanguage);
  };

  const value = {
    language,
    changeLanguage,
    toggleLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

