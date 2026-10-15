import { registerMessages, setLocale, type MessageTree } from '@softov/scena';
import en from './en.json';

// Tests read English: code that translates finds its words here, as a page in English does.
registerMessages('en', en as MessageTree);
setLocale('en');
