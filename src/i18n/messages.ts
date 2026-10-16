import { getLocale, registerLocale, registerMessages, setLocale, subscribeI18n, type MessageTree } from '@softov/scena';
import en from './en.json';
import es from './es.json';
import pt from './pt.json';
import { initialLocale } from './locales.js';

/** The localStorage key the chosen language is kept under; one per browser, not per host. */
export const LOCALE_KEY = 'ahpd-web.locale';

function stored(): string | null {
  try {
    return window.localStorage.getItem(LOCALE_KEY);
  } catch {
    return null;
  }
}

registerLocale({ locale: 'en', name: 'English' });
registerMessages('en', en as MessageTree);
registerMessages('es-419', es as MessageTree, { name: 'Español (Latinoamérica)' });
registerMessages('pt-BR', pt as MessageTree, { name: 'Português (Brasil)' });

setLocale(initialLocale(stored(), navigator.languages));
document.documentElement.lang = getLocale();

// The choice is kept, and the page says which language it is in.
subscribeI18n(() => {
  const locale = getLocale();
  document.documentElement.lang = locale;
  try {
    window.localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // Storage blocked: the choice lasts as long as the page.
  }
});
