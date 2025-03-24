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
                    g: "HELLO",
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
                    g: (v: string) => v === "HELLO",
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

    it("should assert structures with arrays", () => {
        const test = {
            a: [
                {
                    b: 0,
                    c: "string",
                    d: true,
                    e: new Date(),
                    f: "HELLO",
                },
                {
                    b: 1,
                    c: "string",
                    d: true,
                    e: new Date(),
                    f: "HELLO",
                },
            ],
        };

        const expectedCtor = {
            a: [
                {
                    b: Number,
                    c: String,
                    d: Boolean,
                    e: Date,
                    f: (v: string) => v === "HELLO",
                },
            ],
        };

        const failTest = {
            a: [
                {
                    b: String,
                    c: String,
                    d: Boolean,
                    e: Date,
                    f: (v: string) => v === "HELLO",
                },
            ],
        };

        const failTest2 = {
            a: [
                () => {
                    return false;
                },
            ],
        };

        expect(assertStructure(test, expectedCtor)).toBe(true);
        expect(assertStructure(test, expectedCtor)).toBe(true);
        expect(assertStructure(test, failTest)).toBe(false);
        expect(assertStructure(test, failTest2)).toBe(false);
    });
});
