let path = require("path");
let fs = require("fs");
let {merge: webpackMerge} = require("webpack-merge");

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
        return {
            entry: {
                "app.js": path.resolve(__dirname, "src", "app.ts")
            },
            output: {
                path: path.resolve(__dirname, "out"),
                filename: "[name]",
                clean: true
            },
            devtool: argv.mode === "development"? "source-map" : false,
            resolve: {
                extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
                alias: {
                    wpextensions: path.resolve(__dirname, "extensions")
                },
                modules: ['node_modules']
            },
            module: {
                rules: [
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
                            presets: ["@babel/preset-env", "@babel/typescript"]
                        },
                    },
                    {
                        test: /\.(tsx|jsx)$/i,
                        use: [
                            {
                                loader: "babel-loader",
                                options: {
                                    presets: ["@babel/typescript", "@babel/preset-react", "@babel/preset-env"]
                                }
                            }
                        ],
                        type: "asset/resource"
                    },
                    {
                        test: /\.(json)$/i,
                        exclude: /(node_modules)/,
                        loader: "file-loader"
                    }
                ]
            },
            optimization: {
                minimize: argv.mode === "productive"
            },
            plugins: [ ],
            target: "node"
        }
    }
    else if(buildType === "web") {
        let extPath = path.join(__dirname, "extensions");

        return webpackMerge([{
            output: {
                path: path.resolve(__dirname, "out"),
                filename: "[name]"
            },
            devtool: argv.mode === "development"? "source-map" : false,
            resolve: {
                extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
                alias: {
                    wpextensions: path.resolve(__dirname, "extensions")
                },
                modules: ['node_modules']
            },
            module: {
                rules: [
                    {
                        test: /\.(ts|js)$/i,
                        exclude: /(node_modules)/,
                        loader: "babel-loader",
                        options: {
                            plugins: [],
                            presets: ["@babel/preset-env", "@babel/typescript"]
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
                        test: /\.(json)$/i,
                        exclude: /(node_modules)/,
                        loader: "file-loader"
                    }
                ]
            },
            optimization: {
                minimize: argv.mode === "productive"
            },
            plugins: [ ],
        }, ...fs.readdirSync(extPath)
            .filter(file => !file.startsWith("Custom.Template") && file.endsWith("webpack.json"))
            .map(file => {
                let filePath = path.join(extPath, file);
                let data = JSON.parse(fs.readFileSync(filePath, "utf8"));
                return data;
            })
        ]);;
    }
    else {
        return null;
    }
}
