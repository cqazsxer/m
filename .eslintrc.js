module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint',
    sourceType: 'module'
  },
  env: {
    browser: true
  },
  // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
  // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
  extends: ['plugin:vue/essential', 'airbnb-base'],
  // required to lint *.vue files
  plugins: ['vue'],
  globals: {
    ga: true, // Google Analytics
    cordova: true,
    __statics: true
  },
  // add your custom rules here
  rules: {
    'no-param-reassign': 0,
    semi: 0,
    'comma-dangle': [
      'error',
      {
        arrays: 'never',
        objects: 'never',
        imports: 'never',
        exports: 'never',
        functions: 'ignore'
      }
    ],
    'import/first': 0,
    'import/named': 2,
    'import/namespace': 2,
    'import/default': 2,
    'import/export': 2,
    'import/extensions': 0,
    'import/no-unresolved': 0,
    'import/no-extraneous-dependencies': 0,
    'no-console': 0,
    'prefer-template': 0,
    'arrow-parens': 0,
    'function-paren-newline': 0,
    'no-unused-vars': 0,
    'no-trailing-spaces': 0,
    'object-curly-newline': 0,
    'no-underscore-dangle': 0,
    'linebreak-style': 0,
    'prefer-template': 0,
    'max-len': 0,
    'no-mixed-operators': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  }
}
