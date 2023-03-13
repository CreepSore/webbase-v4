const tailwindcss = require("tailwindcss");
const tailwindNesting = require("tailwindcss/nesting");
const postcssImport = require("postcss-import");

module.exports = {
    plugins: [
        "postcss-preset-env",
        postcssImport,
        tailwindNesting,
        tailwindcss,
    ],
};
