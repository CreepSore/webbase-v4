const tailwindcss = require("@tailwindcss/postcss");
const postcssImport = require("postcss-import");
const cssnano = require("cssnano")

module.exports = {
    plugins: [
        "postcss-preset-env",
        tailwindcss,
        cssnano
    ].filter(Boolean),
};
