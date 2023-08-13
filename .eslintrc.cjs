module.exports = {
    env: {
        node: true,
        es2022: true
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:prettier/recommended",
        "plugin:import/typescript"
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
    },
    plugins: ["@typescript-eslint", "simple-import-sort"],
    rules: {
        "import/first": "error",
        "import/newline-after-import": "error",
        "import/no-duplicates": "error",
        "simple-import-sort/imports": "error",
        "sort-imports": "off"
    },
    settings: {
        "import/resolver": {
            typescript: {}
        }
    }
};
