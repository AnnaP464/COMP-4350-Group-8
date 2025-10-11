import reactPlugin from "eslint-plugin-react";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  // JS files
  {
    files: ["**/*.js"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true // <-- allow JSX in JS files
        }
      },
      globals: {
        window: "readonly",
        document: "readonly",
        process: "readonly",
        __dirname: "readonly",
        module: "readonly"
      }
    },
    plugins: {
      react: reactPlugin
    },
    rules: {
      "no-unused-vars": ["warn", { "varsIgnorePattern": "^React$" }],
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-vars": "error"
    },
    settings: {
      react: { version: "detect" }
    }
  },

  // TS/TSX files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json" // type-aware linting
      },
      globals: {
        window: "readonly",
        document: "readonly",
        process: "readonly",
        __dirname: "readonly",
        module: "readonly"
      }
    },
    plugins: {
      react: reactPlugin,
      "@typescript-eslint": tsPlugin
    },
    rules: {
      "no-unused-vars": ["warn", { "varsIgnorePattern": "^React$" }],
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",

      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-key": "warn",
      "react/no-unknown-property": "error"
    },
    settings: {
      react: { version: "detect" }
    }
  }
];
