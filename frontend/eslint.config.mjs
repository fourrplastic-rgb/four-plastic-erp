import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "next.config.js",
    "next.config.ts",
    "debug_login.js",
    "test_login.js",
    "test_dashboard_api.js",
    "**/*.save",
    "**/*.save.js",
  ]),
]);

export default eslintConfig;
