import EnvironmentFile from "../src/service/environment/EnvironmentFile";

const exampleFile = `# I AM A COMMENT
HELLO =   World  
Uwu   = "World2"
Owo=\`"ASDF" ASDFFDSA 'FDSA'\`
MPTY=
MISSING_END_TICK="LMAO
SINGLE_TICK="
BACKTICK_NEWLINES=\`HelloNewline\\r\\n\` # Comment lol
`;

describe("EnvironmentFiles parsing tests", () => {
    it("should parse the environment file correctly", () => {
        const parsed = EnvironmentFile.parse(Buffer.from(exampleFile));

        const expectedMapping = {
            BACKTICK_NEWLINES: "HelloNewline\r\n",
        };

        for(let [key, value] of Object.entries(expectedMapping)) {
            expect(parsed.getMapping(key)).toMatch(value);
            expect(process.env[key]).toBeUndefined();
        }

        parsed.apply();

        for(let [key, value] of Object.entries(expectedMapping)) {
            expect(process.env[key]).toMatch(value);
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