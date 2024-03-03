const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");
const minimist = require("minimist");

const tailwindcss = require("tailwindcss");
const tailwindNesting = require("tailwindcss/nesting");
const postcssImport = require("postcss-import");
const cssnano = require("cssnano")
const postcss = require("postcss");
const postcssPresetEnv = require("postcss-preset-env");

const { default: sassPlugin } = require("esbuild-sass-plugin");

const parsedArgs = minimist(process.argv.slice(2), {
    alias: {
        watch: "w",
    },
    string: ["mode"],
    boolean: ["watch"],
});

const getExtensionConfigs = function() {
    const extensionDir = fs.readdirSync(path.resolve(__dirname, "..", "extensions"));
    const extensionDirs = extensionDir
        .filter(f => f !== "Custom.Template" && fs.statSync(path.resolve(__dirname, "..", "extensions", f)).isDirectory());

    const extensionFiles = extensionDirs
        .map(f => path.resolve(__dirname, "..", "extensions", f, "esbuild.json"))
        .filter(f => fs.existsSync(f))
        .map(f => fs.readFileSync(f))
        .map(f => JSON.parse(f.toString("utf8")));

    return extensionFiles;
}

const buildWebApp = async function() {
    const extensionConfigs = getExtensionConfigs();

    /** @type {import("esbuild").SameShape<import("esbuild").BuildOptions, import("esbuild").BuildOptions>} */
    const buildParams = {
        entryPoints: [
            ...extensionConfigs.map(c => c.entryPoints).filter(Boolean).flat(),
        ],
        entryNames: "[dir]/[name]",
        bundle: true,
        outbase: path.resolve(__dirname, "..", "extensions"),
        outdir: path.resolve(__dirname, "..", "out"),
        sourcemap: parsedArgs.mode === "development" ? "both" : undefined,
        plugins: [sassPlugin({
            type: "style",
            async transform(source, resolveDir) {
                const {css} = await postcss([
                    // @ts-ignore
                    postcssPresetEnv({stage: 0}),
                    postcssImport,
                    tailwindNesting,
                    tailwindcss,
                    cssnano
                ].filter(Boolean)).process(source)
                return css
            },
        })]
    };

    if(parsedArgs.watch) {
        const context = await esbuild.context(buildParams);
        await context.watch();
        console.log("Watching for changes...");
        return;
    }

    console.log("Started building...");
    await esbuild.build(buildParams);
    console.log("Build finished.");
}

const main = async function() {
    await buildWebApp();
}

main();
