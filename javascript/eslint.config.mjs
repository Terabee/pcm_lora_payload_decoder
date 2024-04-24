import globals from "globals";
import pluginJs from "@eslint/js";
import stylisticJs from '@stylistic/eslint-plugin-js';
import jest from "eslint-plugin-jest";


export default [
  {
    languageOptions: { globals: globals.browser },
    plugins: {
      '@stylistic/js': stylisticJs
    },
    rules: {
      '@stylistic/js/semi': ["error", "always"],
    },

  },
  {
    files: [
      '*test.js'
    ],
    ...jest.configs['flat/recommended'],
  },
  pluginJs.configs.recommended,
];