module.exports = {
  arrowParens: 'always',
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  bracketSpacing: true,
  printWidth: 80,
  useTabs: false,
  tabWidth: 2,
  trailingComma: 'none',
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindFunctions: ['clsx', 'cn'],
  tailwindAttributes: ['className', 'tw']
};
