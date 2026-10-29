export default [{
  files: ["src/**/*.{js,jsx}"],
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
    globals: { window: "readonly", document: "readonly", console: "readonly", fetch: "readonly", URLSearchParams: "readonly" }
  },
  rules: {
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "no-undef": "error"
  }
}];
