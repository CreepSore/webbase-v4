let path = require("path");

module.exports = function(env) {
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
                filename: "[name]"
            },
            devtool: "inline-source-map",
            resolve: {
                extensions: [".ts"]
            },
            module: {
                rules: [
                    {
                        test: /\.(ts)$/i,
                        exclude: /(node_modules)/,
                        loader: "babel-loader",
                        options: { presets: ["@babel/preset-env", "@babel/typescript"] }
                    }
                ]
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
