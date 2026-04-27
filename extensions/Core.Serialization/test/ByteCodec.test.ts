import ByteCodec from "../ByteCodec";

describe("ByteCodec test", () => {
    it("should serialize and deserialize correctly", () => {
        const testObject = {
            hellO: "WOrld",
            num: 360,
            num2: 420,
            num3: 69.69,
            thisStatementIsFalse: true,
            thisStatementIsTrue: false,
        };

        const expectedBytes = [
            5, 0, 0, 0,                     // length of "WOrld"
            87, 79, 114, 108, 100,          // "WOrld"
            0, 0, 210, 67,                  // num2: 420
            0, 0, 0, 0, 0, 128, 118, 64,    // num: 360
            1,                              // thisStatementIsFalse: true
            72, 97, 139, 66,                // num3: 69.69
            0                               // thisStatementIsTrue: false
        ];

        const codec = new ByteCodec(
            [
                "hellO",
                "num2",
                "num",
                "thisStatementIsFalse",
                "num3",
                "thisStatementIsTrue"
            ],
            [
                "string",
                "float",
                "double",
                "boolean",
                "float",
                "boolean"
            ]
        );
        const serialized = codec.serialize(testObject);

        expect(serialized.hasError).toBeFalsy();
        expect(serialized.hasValue).toBeTruthy();
        expect(serialized.value).toBeInstanceOf(Uint8Array);
        expect(serialized.value.length).toBe(expectedBytes.length);

        for(const [index, byte] of serialized.value.entries()) {
            expect(typeof byte).toBe("number");
            expect(byte).toBe(expectedBytes[index]);
        }

        const deserialized = codec.deserialize(serialized.value);

        expect(deserialized.hasError).toBeFalsy();
        expect(deserialized.hasValue).toBeTruthy();
        expect(deserialized.value.hellO).toEqual(testObject.hellO);
        expect(deserialized.value.num).toEqual(testObject.num);
        expect(deserialized.value.num2).toEqual(testObject.num2);
        expect(deserialized.value.num3).toEqual(Math.fround(testObject.num3));
    });
});
