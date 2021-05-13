module.exports = {
   'env': {
      'browser': true,
      'es6': true
   },
   'extends': [
      'eslint:recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:vue/vue3-strongly-recommended'
   ],
   'globals': {
      'Atomics': 'readonly',
      'SharedArrayBuffer': 'readonly',
      'module': 'readonly',
      'require': 'readonly',
      'process': 'readonly'
   },
   'parserOptions': {
      'ecmaVersion': 2021,
      'parser': '@typescript-eslint/parser',
      'sourceType': 'module'
   },
   'plugins': [
      'vue',
      '@typescript-eslint'
   ],

   'rules': {

      'vue/require-default-prop': [
         'off'
      ],

      'vue/html-self-closing': [
         'off'
      ],

      'vue/max-attributes-per-line': [
         'off'
      ],

      'vue/html-indent': [
         //Turned off because I like 3, not 2
         'off'
      ],

      'vue/attribute-hyphenation': [
         //Typing hyphens is annoying
         'off'
      ],

      'vue/no-multiple-template-root': [
         'off'
      ],

      'vue/no-v-model-argument': [
         'off'
      ],

      'vue/singleline-html-element-content-newline': [
         'off'
      ],

      'vue/component-definition-name-casing': [
         'error',
         'kebab-case'
      ],

      '@typescript-eslint/naming-convention': [
         'error',
         {
            'selector': 'interface',
            'format': ['PascalCase'],
            'custom': {
               'regex': '^I[A-Z]',
               'match': true
            }
         }
      ],

      '@typescript-eslint/explicit-module-boundary-types': [
         //https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/explicit-module-boundary-types.md
         'off'
      ],

      '@typescript-eslint/no-explicit-any': [
         'off'
      ],

      '@typescript-eslint/no-non-null-assertion': [
         'off'
      ],

      '@typescript-eslint/no-inferrable-types': [
         'off'
      ],

      '@typescript-eslint/no-unused-vars': [
         'warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_', ignoreRestSiblings: true }
      ],

      'indent': [
         //Turning off because I'm not sure how to get it to require initial indent in vue scripts
         'off',
         3
      ],
      'quotes': [
         'error',
         'single'
      ],
      'semi': [
         'error',
         'always'
      ]
   }
};