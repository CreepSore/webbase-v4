import assertStructure from "./assertStructure";


describe("assertStructure tests", () => {
    it("should assert zero-layered structures", () => {
        const testCases: Array<[string, any, any, boolean]> = [
            ["null", null, null, true],
            ["undefined", undefined, undefined, true],
            ["string", "string", "string", true],
            ["string ctor", "string", String, true],
            ["number", 0, 0, true],
            ["number ctor", 0, Number, true],
            ["boolean", false, false, true],
            ["boolean ctor", false, Boolean, true],
            ["date", new Date(), new Date(), true],
            ["date ctor", new Date(), Date, true],
        ];

        testCases.forEach(([description, is, expected, result]) => {
            if(assertStructure(is, expected) !== result) {
                throw Error(`Failed test case: ${description}`);
            }
        });
    });

    it("should assert multi-layered structures", () => {
        const test = {
            a: {
                b: {
                    c: 0,
                    d: "string",
                    e: true,
                    f: new Date(),
                },
            },
        };

        const expectedCtor = {
            a: {
                b: {
                    c: Number,
                    d: String,
                    e: Boolean,
                    f: Date,
                },
            },
        };

        const failTest = {
            a: {
                b: {
                    c: Number,
                    d: String,
                    e: Boolean,
                    f: String,
                },
            },
        };

        expect(assertStructure(test, expectedCtor)).toBe(true);
        expect(assertStructure(test, expectedCtor)).toBe(true);
        expect(assertStructure(test, failTest)).toBe(false);
    });
});
