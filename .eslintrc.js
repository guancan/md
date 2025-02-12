module.exports = {
  root: true, // 标记为根配置文件
  parser: `vue-eslint-parser`, // 使用 vue 解析器
  parserOptions: {
    parser: `@typescript-eslint/parser`, // TypeScript 解析器
    ecmaVersion: `latest`,
    sourceType: `module`,
  },
  extends: [
    `plugin:vue/vue3-recommended`, // Vue3 推荐规则
    `plugin:@typescript-eslint/recommended`, // TypeScript 推荐规则
  ],
  rules: {
    'quotes': [`error`, `double`],
    'unused-imports/no-unused-vars': `warn`,
  },
  overrides: [
    {
      files: [`*.d.ts`],
      rules: {
        'quotes': `off`,
        '@typescript-eslint/quotes': `off`,
        '@typescript-eslint/naming-convention': `off`,
        '@typescript-eslint/no-explicit-any': `off`,
        '@typescript-eslint/ban-types': `off`,
      },
    },
  ],
}
