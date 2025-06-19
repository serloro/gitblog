import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLanguage, getCurrentLanguage, getAvailableLanguages } from '@/lib/i18n';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  availableLanguages: { code: string; name: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'app_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const availableLanguages = getAvailableLanguages();

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && availableLanguages.some(lang => lang.code === savedLanguage)) {
        changeLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Failed to load language preference:', error);
    }
  };

  const changeLanguage = async (language: string) => {
    try {
      setLanguage(language);
      setCurrentLanguage(language);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}