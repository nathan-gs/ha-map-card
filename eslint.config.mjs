import globals from "globals";
import pluginJs from "@eslint/js";
import jsdoc from 'eslint-plugin-jsdoc';


export default [
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  jsdoc.configs['flat/recommended'],
  {
    plugins: {
      jsdoc,
    },
    rules: {
      'jsdoc/require-returns-description': 0,
      'jsdoc/require-param-description': 0
    }
  }
];