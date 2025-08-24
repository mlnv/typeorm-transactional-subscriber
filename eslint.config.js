// @ts-check
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.{js,ts,jsx,tsx}", "!**/dist/**"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      indent: ["error", 2]
    }
  }
];
