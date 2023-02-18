let path = require("path");
let fs = require("fs");
let {merge: webpackMerge} = require("webpack-merge");

let extPath = path.join(__dirname, "extensions");

let extensionConfigs = fs.readdirSync(extPath)
    .filter(file => !file.startsWith("Custom.Template") && file.endsWith("webpack.json"))
    .map(file => {
        let filePath = path.join(extPath, file);
        let data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return data || {};
    });

const buildAppConfig = (env, argv) => {
    extensionConfigs = extensionConfigs.map(cfg => cfg.appBuildConfig).filter(Boolean);

    return webpackMerge([{
        entry: {
            "app.js": path.resolve(__dirname, "src", "app.ts")
        },
        output: {
            path: path.resolve(__dirname, "out"),
            filename: "[name].js",
            clean: true
        },
        devtool: argv.mode === "development" ? "inline-source-map" : false,
        resolve: {
            extensions: [".ts", ".js", ".json"],
            alias: {
                wpextensions: path.resolve(__dirname, "extensions"),
                "@extensions": path.resolve(__dirname, "extensions")
            },
            modules: ['node_modules']
        },
        externals: {},
        module: {
            rules: [
                {
                    oneOf: [
                        {
                            test: /\.(ts|js)$/i,
                            exclude: /(node_modules)/,
                            loader: "babel-loader",
                            options: {
                                plugins: [
                                    ["babel-plugin-tsconfig-paths", {
                                        rootDir: ".",
                                        tsconfig: "tsconfig.json",
                                    }]
                                ],
                                presets: ["@babel/typescript", ["@babel/preset-env", {
                                    targets: {
                                        node: "17"
                                    }
                                }]]
                            },
                        },
                        {
                            test: /\.(tsx|jsx)$/i,
                            exclude: /(node_modules)/,
                            use: [
                                {
                                    loader: "babel-loader",
                                    options: {
                                        presets: ["@babel/typescript", "@babel/preset-react", ["@babel/preset-env", {
                                            targets: {
                                                node: "17"
                                            }
                                        }]]
                                    }
                                }
                            ],
                            type: "asset/resource"
                        },
                        {
                            test: /\.(json)$/i,
                            exclude: /(node_modules)/
                        },
                        {
                            test: /\.png$/i,
                            type: "asset/inline"
                        },
                        { test: /\.(css)$/i, use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"] }
                    ]
                }
            ]
        },
        optimization: {
            minimize: argv.mode === "productive",
            mangleExports: false
        },
        plugins: [ ],
        target: "node"
    }, ...extensionConfigs]);
};

const buildWebConfig = (env, argv) => {
    extensionConfigs = extensionConfigs.map(cfg => cfg.webBuildConfig).filter(Boolean);

    return webpackMerge([{
        entry: {},
        output: {
            path: path.resolve(__dirname, "out"),
            filename: "[name]"
        },
        devtool: argv.mode === "development" ? "inline-source-map" : false,
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
            modules: ['node_modules'],
            alias: {
                "@extensions": extPath
            }
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
                            targets: "> 0.25%, not dead"
                        }], "@babel/typescript"]
                    },
                },
                {
                    test: /\.(tsx|jsx)$/i,
                    exclude: /(node_modules)/,
                    use: [
                        {
                            loader: "babel-loader",
                            options: {
                                presets: ["@babel/typescript", "@babel/preset-react", "@babel/preset-env"]
                            }
                        }
                    ]
                },
                {
                    test: /\.png$/i,
                    type: "asset/inline"
                },
                { test: /\.(css)$/i, exclude: /(node_modules)/, use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"] }
            ]
        },
        optimization: {
            minimize: argv.mode === "productive",
            mangleExports: false,
            chunkIds: "named"
        },
        plugins: [ ],
    }, ...extensionConfigs]);
}

module.exports = function(env, argv) {
    let buildType;
    if(!env.buildtype) {
        console.warn("[WARN] No Build Type specified, defaulting to ['app']");
        buildType = "app";
    }
    else if(["app", "web"].includes(env.buildtype)){
        buildType = env.buildtype;
    }
    else {
        console.error("[ERROR] Invalid Build Type specified.");
    }

    if(buildType === "app") {
        return buildAppConfig(env, argv);
    }
    else if(buildType === "web") {
        return buildWebConfig(env, argv);
    }
    else {
        return null;
    }
}
