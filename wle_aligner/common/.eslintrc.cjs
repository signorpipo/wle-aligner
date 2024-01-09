module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "tsconfig.json",
        tsconfigRootDir: __dirname
    },
    env: {
        browser: true
    },
    globals: {
    },
    plugins: [
        "deprecation",
        "@typescript-eslint"
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    rules: {
        "semi": "error",
        "deprecation/deprecation": "error",
        "@typescript-eslint/no-unused-vars": ["error", { "args": "none", "varsIgnorePattern": "^__" }]
    },
    ignorePatterns: [
        "/node_modules/",
        ".eslintrc.cjs"
    ],
    overrides: [
    ]
};