import path from "path";
import { fileURLToPath } from "url";
import reactPlugin from "eslint-plugin-react";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

// ✅ Convert module URL to absolute filesystem path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

  // TypeScript for API (server-side)
  {
    files: ["backend/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: path.join(__dirname, "backend/tsconfig.json"), // ✅ absolute path
        tsconfigRootDir: __dirname
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
      "@typescript-eslint": tsPlugin
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },

  // TypeScript + React for Front-end
  {
    files: ["frontend/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: path.join(__dirname, "frontend/tsconfig.eslint.json"), // <-- use the real app tsconfig
        tsconfigRootDir: __dirname
      },
      globals: { window: "readonly", document: "readonly", process: "readonly", __dirname: "readonly", module: "readonly" }
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
    settings: { react: { version: "detect" } }
  }
];
