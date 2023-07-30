const tailwindcss = require("tailwindcss");
const tailwindNesting = require("tailwindcss/nesting");
const postcssImport = require("postcss-import");
const cssnano = require("cssnano")

module.exports = {
    plugins: [
        "postcss-preset-env",
        postcssImport,
        tailwindNesting,
        tailwindcss,
        cssnano
    ].filter(Boolean),
};
