module.exports = {
  rules: {
    'unused-imports/no-unused-vars': `warn`, // 将错误降级为警告
    'quotes': [`error`, `double`], // 强制使用双引号
  },
  overrides: [
    {
      files: [`*.d.ts`], // 针对所有的 .d.ts 文件
      rules: {
        'quotes': `off`, // 关闭引号检查
        '@typescript-eslint/quotes': `off`, // 关闭 TypeScript 的引号检查
        '@typescript-eslint/naming-convention': `off`,
        '@typescript-eslint/no-explicit-any': `off`,
      },
    },
  ],
}
