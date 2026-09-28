import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tsdoc from "eslint-plugin-tsdoc";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/coverage/**", "**/node_modules/**", "**/docs/api/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.js", "*.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      tsdoc,
    },
    rules: {
      "tsdoc/syntax": "warn",
      "max-classes-per-file": ["error", 1],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      // static-only helper classes (MathUtils, ColorUtils…) are the project convention
      "@typescript-eslint/no-extraneous-class": ["error", { allowStaticOnly: true }],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      // unit aliases (Range<Pixels>) are plain numbers but document intent, so keep them explicit
      "@typescript-eslint/no-unnecessary-type-arguments": "off",
      "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
      "@typescript-eslint/explicit-member-accessibility": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
  {
    files: ["**/test/**/*.ts", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.config.ts"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // build scripts run in Node
    files: ["**/scripts/**/*.mjs"],
    languageOptions: {
      globals: { console: "readonly", process: "readonly", URL: "readonly" },
    },
    // plain JS: types live in JSDoc `{type}` annotations, which TSDoc syntax rules reject
    rules: {
      "tsdoc/syntax": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  prettier,
);
