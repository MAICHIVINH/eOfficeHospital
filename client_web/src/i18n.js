import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import vi from './locales/vi.json'
import en from './locales/en.json'

i18n
    // Detect user language
    .use(LanguageDetector)
    // Pass the i18n instance to react-i18next
    .use(initReactI18next)
    // Initialize i18next
    .init({
        resources: {
            vi: { translation: vi },
            en: { translation: en }
        },
        fallbackLng: 'vi', // Default language is Vietnamese
        lng: 'vi', // Initial language
        debug: false,

        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng'
        },

        interpolation: {
            escapeValue: false // React already escapes values
        },

        react: {
            useSuspense: false
        }
    })

export default i18n
