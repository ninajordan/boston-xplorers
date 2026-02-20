import globals from "globals";
import pluginJs from "@eslint/js";
import htmlPlugin from "eslint-plugin-html";
import eslintConfigPrettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  pluginJs.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["**/*.html"],
    plugins: { html: htmlPlugin },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "no-console": "off",

      //  allow unused variables
      "no-unused-vars": "off",

      // allow harmless regex escapes
      "no-useless-escape": "off",
    },
  },
];
