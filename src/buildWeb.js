const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");
const minimist = require("minimist");
const perf_hooks = require("perf_hooks");

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
    boolean: ["watch", "meta"],
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
                // @ts-ignore
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
        })],
        legalComments: "external",
        minify: parsedArgs.mode !== "development",
        lineLimit: parsedArgs.mode === "development" ? 0 : 0,
        metafile: parsedArgs.meta,
        treeShaking: parsedArgs.mode !== "development",
        splitting: true,
        format: "esm",
        chunkNames: "chunks/[name]-[hash]",
        publicPath: "/",
    };

    if(parsedArgs.watch) {
        try {
            const webConfigPath = path.resolve(__dirname, "..", "cfg", "Core.Web.json");
            const webConfig = JSON.parse(fs.readFileSync(webConfigPath, "utf8"));
            if(fs.existsSync(webConfigPath)) {
                buildParams.plugins ??= [];
                buildParams.plugins.push({
                    name: "Live-Reload",
                    setup(build) {
                        build.onEnd(async() => {
                            console.log("Rebuilt files");
                            try {
                                await fetch(`http://localhost:${webConfig.port}/Core.Web/ForceReload`, {method: "POST"});
                            }
                            catch {
                                console.log("ERROR", "ForceReload-Endpoint does not seem to be active.");
                            }
                        });
                    }
                });
            }
        }
        catch {}

        const context = await esbuild.context(buildParams);

        await context.watch();
        console.log("Watching for changes...");
        return;
    }

    console.log("Started building...");
    const performance = perf_hooks.performance.measure("start");
    const buildResult = await esbuild.build(buildParams);

    const metaPath = path.resolve(__dirname, "..", "out", "meta.json");
    if(fs.existsSync(metaPath)) {
        fs.unlinkSync(metaPath);
    }

    if(buildResult.metafile && parsedArgs.meta) {
        fs.writeFileSync(metaPath, JSON.stringify(buildResult.metafile, null, 4));
    }

    console.log(`Build finished after ${Math.floor(performance.duration * 1000) / 1000}ms`);
}

const main = async function() {
    await buildWebApp();
}

main();
