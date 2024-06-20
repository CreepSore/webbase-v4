const path = require("path");
const fs = require("fs");
const {merge: webpackMerge} = require("webpack-merge");

const extPath = path.join(__dirname, "extensions");

let extensionConfigs = fs.readdirSync(extPath)
    .filter(file => !file.startsWith("Custom.Template") && file.endsWith("webpack.json"))
    .map(file => {
        const filePath = path.join(extPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return data || {};
    }).filter(Boolean);

extensionConfigs = [...extensionConfigs, ...fs.readdirSync(extPath)
    .filter(file => fs.statSync(path.join(extPath, file)).isDirectory() && !file.startsWith("Custom.Template"))
    .map(file => {
        const filePath = path.join(extPath, file, "webpack.json");
        if(!fs.existsSync(filePath)){
            return null;
        }
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return data || {};
    }).filter(Boolean)];

const buildAppConfig = (env, argv) => {
    extensionConfigs = extensionConfigs.map(cfg => cfg.appBuildConfig).filter(Boolean);

    return webpackMerge([{
        entry: {
            "app": path.resolve(__dirname, "src", "app.ts"),
        },
        output: {
            path: path.resolve(__dirname, "out"),
            filename: "[name].js",
            clean: true,
        },
        devtool: argv.mode === "development" ? "inline-source-map" : false,
        resolve: {
            extensions: [".ts", ".js"],
            alias: {
                wpextensions: path.resolve(__dirname, "extensions"),
                "@extensions": path.resolve(__dirname, "extensions"),
            },
            modules: ["node_modules"],
            symlinks: false,
        },
        externals: {},
        module: {
            rules: [
                {
                    oneOf: [
                        {
                            test: /\.(ts|js)$/i,
                            exclude: /(node_modules)/,
                            include: /(src)|(extensions)/,
                            loader: "babel-loader",
                            options: {
                                babelrc: true,
                                plugins: [
                                    ["babel-plugin-tsconfig-paths", {
                                        rootDir: ".",
                                        tsconfig: "tsconfig.json",
                                    }],
                                    ["@babel/plugin-proposal-decorators", {
                                        legacy: true,
                                    }],
                                ],
                                presets: ["@babel/typescript", ["@babel/preset-env", {
                                    targets: {
                                        node: "18",
                                    },
                                }]],
                            },
                        },
                    ],
                },
            ],
        },
        optimization: {
            minimize: argv.mode === "productive",
            moduleIds: "natural",
            mangleExports: false,
            concatenateModules: false,
            removeEmptyChunks: false,
            removeAvailableModules: false,
            splitChunks: false,
        },
        plugins: [ ],
        target: "node",
    }, ...extensionConfigs]);
};

const buildWebConfig = (env, argv) => {
    extensionConfigs = extensionConfigs.map(cfg => cfg.webBuildConfig).filter(Boolean);

    return webpackMerge([{
        entry: {},
        output: {
            path: path.resolve(__dirname, "out"),
            filename: "[name]",
        },
        devtool: argv.mode === "development" ? "inline-source-map" : false,
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
            modules: ["node_modules"],
            alias: {
                "@extensions": extPath,
            },
        },
        module: {
            rules: [
                {
                    test: /\.(ts|js)$/i,
                    exclude: /(node_modules)/,
                    loader: "babel-loader",
                    options: {
                        plugins: [],
                        presets: [["@babel/preset-env", {
                            targets: "> 0.25%, not dead",
                        }], "@babel/typescript"],
                    },
                },
                {
                    test: /\.(tsx|jsx)$/i,
                    exclude: /(node_modules)/,
                    use: [
                        {
                            loader: "babel-loader",
                            options: {
                                presets: ["@babel/typescript", "@babel/preset-react", "@babel/preset-env"],
                            },
                        },
                    ],
                },
                {
                    test: /\.png$/i,
                    type: "asset/inline",
                },
                { test: /\.(css)$/i, exclude: /(node_modules)/, use: [{loader: "style-loader", options: { injectType: "singletonStyleTag" }}, "css-loader", "postcss-loader", "sass-loader"] },
            ],
        },
        optimization: {
            minimize: argv.mode === "productive",
            mangleExports: false,
            chunkIds: "named",
        },
        plugins: [ ],
    }, ...extensionConfigs]);
};

module.exports = function(env, argv){
    let buildType;
    if(!env.buildtype){
        console.warn("[WARN] No Build Type specified, defaulting to ['app']");
        buildType = "app";
    }
    else if(["app", "web"].includes(env.buildtype)){
        buildType = env.buildtype;
    }
    else {
        console.error("[ERROR] Invalid Build Type specified.");
    }

    if(buildType === "app"){
        return buildAppConfig(env, argv);
    }
    else if(buildType === "web"){
        return buildWebConfig(env, argv);
    }

    return null;
};
