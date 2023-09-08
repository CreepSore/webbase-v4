const fs = require("fs");
const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json").toString("utf-8"));
const moduleNameMapper = Object.fromEntries(Object.entries(require("tsconfig-paths-jest")(tsconfig)).map(([k, v]) => [k, v.replace("<rootDir>", "<rootDir>/src")]));

module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
      "node_modules/variables/.+\\.(j|t)sx?$": "ts-jest"
    },
    transformIgnorePatterns: [
      "node_modules/(?!variables/.*)"
    ],
    moduleNameMapper,
    rootDir: "./"
}
