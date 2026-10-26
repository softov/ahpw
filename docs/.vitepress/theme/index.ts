import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import Shot from './Shot.vue';
import './custom.css';

/** VitePress's default theme, with the ahpapp palette and the screenshot component. */
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Shot', Shot);
  },
} satisfies Theme;
