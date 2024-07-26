// eslint.config.cjs
module.exports = [
  {
    files: ["*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      // ここに適用したい他のルールを追加
    },
  },
];
