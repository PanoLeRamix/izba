import i18n from 'i18next';
import * as Localization from 'expo-localization';
import { initReactI18next } from 'react-i18next';
import en from '../assets/locales/en.json';
import fr from '../assets/locales/fr.json';
import { storage } from '../utils/storage';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
};

const SUPPORTED_LANGUAGES = new Set(['en', 'fr']);

export const initI18n = async () => {
  if (i18n.isInitialized) {
    return i18n;
  }

  const savedLng = await storage.getItem('user-language');
  const systemLng = Localization.getLocales()[0].languageCode ?? 'fr';
  const preferredLanguage = savedLng || systemLng;
  const lng = SUPPORTED_LANGUAGES.has(preferredLanguage) ? preferredLanguage : 'fr';

  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  return i18n;
};

export default i18n;
