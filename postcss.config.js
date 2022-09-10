let tailwindcss = require("tailwindcss");
let tailwindNesting = require("tailwindcss/nesting");
let postcssImport = require("postcss-import");

module.exports = {
    plugins: [
        "postcss-preset-env",
        postcssImport,
        tailwindNesting,
        tailwindcss
    ]
};