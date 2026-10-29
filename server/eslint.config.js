export default [{
  files: ["**/*.js"],
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    globals: { console: "readonly", process: "readonly", URL: "readonly" }
  },
  rules: {
    "no-unused-vars": ["error", { argsIgnorePattern: "^next$|^res$|^req$" }],
    "no-undef": "error"
  }
}];
