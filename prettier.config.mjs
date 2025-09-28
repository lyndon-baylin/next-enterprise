/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: 'es5',
  tabWidth: 2,
  printWidth: 120,
  semi: true,
  singleQuote: true,
  useTabs: false,
  plugins: ['prettier-plugin-tailwindcss'],
  overrides: [
    {
      files: ['*.json', '*.yml'],
      options: {
        tabWidth: 4,
      },
    },
  ],
};

export default config;
