import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import pl from './locales/pl.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';
import sk from './locales/sk.json';
import cs from './locales/cs.json';
import de from './locales/de.json';
import it from './locales/it.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const language = await AsyncStorage.getItem('user-language');
      if (language) {
        callback(language);
      } else {
        callback('en');
      }
    } catch (error) {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.error('Error saving language', error);
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      pl: { translation: pl },
      ru: { translation: ru },
      uk: { translation: uk },
      sk: { translation: sk },
      cs: { translation: cs },
      de: { translation: de },
      it: { translation: it },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
