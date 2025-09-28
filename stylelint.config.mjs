/** @type {import('stylelint').Config} */
const stylelintConfig = {
  extends: ['stylelint-config-standard'],
  rules: {
    'color-no-invalid-hex': true,
    'color-function-notation': null,
    'alpha-value-notation': null,
    'lightness-notation': null,
    'hue-degree-notation': null,
    'at-rule-no-deprecated': [
      true,
      {
        ignoreAtRules: ['apply', 'variants', 'responsive', 'screen'],
      },
    ],
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['extends', 'tailwind', 'tailwindcss', 'tw-animate-css', 'custom-variant', 'theme'],
      },
    ],
  },
};

export default stylelintConfig;
