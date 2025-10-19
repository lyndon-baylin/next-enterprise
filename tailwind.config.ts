import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Variable"', ...defaultTheme.fontFamily.sans],
        mono: ['"Geist Mono Variable"', ...defaultTheme.fontFamily.mono],
      },
      fontWeight: {
        variable: 'var(--geist-wght)',
      },
    },
  },
  plugins: [],
};

export default config;
