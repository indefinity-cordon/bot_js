import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    // Нет смысла обновлять
    ignores: [
      "server_modules/servers/bluemoon.js",
      "server_modules/servers/cm.js",
    ],
  },
  { files: ["**/*.js"], languageOptions: { sourceType: "module" } },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
];
