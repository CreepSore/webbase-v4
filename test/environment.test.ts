import { kMaxLength } from "buffer";
import EnvironmentFileParser from "../src/service/environment/EnvironmentFileParser";
import EnvironmentFile from "../src/service/environment/EnvironmentFile";

const exampleFile = `# I AM A COMMENT
HELLO =   World  
Uwu   = "World2"
Owo=\`"ASDF" ASDFFDSA 'FDSA'\`
MPTY=
MISSING_END_TICK="LMAO
SINGLE_TICK="
BACKTICK_NEWLINES=\`Hello\\r\\n\` # Comment lol
QUOTE_NEWLINES="\\r\\n"
`;

describe("EnvironmentFiles parsing tests", () => {
    it("should parse the environment file correctly", () => {
        const parsed = EnvironmentFile.parse(Buffer.from(exampleFile));

        const expectedMapping = {
            HELLO: "World",
            Uwu: "World2",
            Owo: "\"ASDF\" ASDFFDSA 'FDSA'",
            MPTY: "",
            MISSING_END_TICK: "LMAO",
            SINGLE_TICK: "",
            BACKTICK_NEWLINES: "Hello\r\n",
            QUOTE_NEWLINES: "\\r\\n"
        };

        for(let [key, value] of Object.entries(expectedMapping)) {
            expect(parsed.getMapping(key)).toEqual(value);
            expect(process.env[key]).not.toEqual(value);
        }

        parsed.apply();

        for(let [key, value] of Object.entries(expectedMapping)) {
            expect(process.env[key]).toEqual(value);
        }
    });

    it("Should throw", () => {
        let hasThrown = false;

        try {
            EnvironmentFile.parse(Buffer.from("# Throw-Test\nTEST"))
        }
        catch {
            hasThrown = true;
        }

        expect(hasThrown).toBeTruthy();
    });
});