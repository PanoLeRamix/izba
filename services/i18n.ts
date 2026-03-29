import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { storage } from '../utils/storage';

import en from '../assets/locales/en.json';
import fr from '../assets/locales/fr.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
};

// We create a wrapper to initialize i18n asynchronously with persisted language
export const initI18n = async () => {
  const savedLng = await storage.getItem('user-language');
  const systemLng = Localization.getLocales()[0].languageCode ?? 'fr';
  
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLng || systemLng,
      fallbackLng: 'fr',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
};

export default i18n;
