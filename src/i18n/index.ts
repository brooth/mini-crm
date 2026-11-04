import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ru from './ru.json';

// UI strings are written in Russian inline; this only covers keys used inside shared components.
i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
    },
    lng: 'ru',
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
