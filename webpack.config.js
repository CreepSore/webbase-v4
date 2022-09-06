let path = require("path");

module.exports = function(env, argv) {
    let buildType;
    if(!env.buildtype) {
        console.warn("[WARN] No Build Type specified, defaulting to ['app']");
        buildType = "app";
    }
    else if(["app", "plugins"].includes(env.buildtype)){
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
                extensions: [".ts", ".js"],
                alias: {
                    wpextensions: path.resolve(__dirname, "extensions")
                }
            },
            module: {
                rules: [
                    {
                        test: /\.(ts)$/i,
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
                        }
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
    else if(buildType === "plugins"){
        console.error("[ERROR] Plugins are not supported yet!");
        return null;
    }
    else {
        return null;
    }
}
