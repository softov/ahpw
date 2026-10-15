import { registerLocale } from '@softov/scena';

// Invented languages, so the language list can be tried at the size it may
// reach: 3 real ones and these make 32. They carry no messages, so every key
// falls back to English. Loaded only in development (see messages.ts).
const FICTIONAL: Array<[string, string]> = [
  ['x-aur', 'Aurelian'],
  ['x-bor', 'Borealic'],
  ['x-cal', 'Caldorian'],
  ['x-dra', 'Draconic'],
  ['x-eld', 'Eldmarish'],
  ['x-fen', 'Fenwick'],
  ['x-gla', 'Glaserine'],
  ['x-hal', 'Halvoran'],
  ['x-ish', 'Ishtaric'],
  ['x-jor', 'Jorvaan'],
  ['x-kel', 'Kelthic'],
  ['x-lum', 'Lumerian'],
  ['x-mar', 'Marovian'],
  ['x-nor', 'Nordessa'],
  ['x-oss', 'Ossaline'],
  ['x-pel', 'Pelagic'],
  ['x-qua', 'Quarrish'],
  ['x-rho', 'Rhovanic'],
  ['x-syl', 'Sylvanese'],
  ['x-tal', 'Talmyrian'],
  ['x-umb', 'Umbrian Low'],
  ['x-val', 'Valdorese'],
  ['x-wyn', 'Wynnish'],
  ['x-xan', 'Xanthic'],
  ['x-yor', 'Yorvic'],
  ['x-zar', 'Zarathine'],
  ['x-amb', 'Ambrosian'],
  ['x-cin', 'Cinderese'],
  ['x-tid', 'Tidewater Cant'],
];

for (const [locale, name] of FICTIONAL) registerLocale({ locale, name });
