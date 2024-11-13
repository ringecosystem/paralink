module.exports = {
  arrowParens: 'always',
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  bracketSpacing: true,
  printWidth: 80, // 减小行宽，使代码更易读
  useTabs: false,
  tabWidth: 2,
  trailingComma: 'none',
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindFunctions: ['clsx', 'cn'], // 支持 clsx 和 cn 函数中的类名排序
  tailwindAttributes: ['className', 'tw'], // 指定需要格式化的属性
};
