import CodecError from "../CodecError";
import JsonCodec from "../JsonCodec";

describe("JsonCodec Test", () => {
    it("Should serialize and deserialize correctly", () => {
        const codec = new JsonCodec();

        const testObject = {
            hellO: "WOrld",
        };

        const serialized = codec.serialize(testObject);
        expect(serialized.error).toBeUndefined();
        expect(serialized.hasError).toBeFalsy();
        expect(serialized.hasValue).toBeTruthy();
        expect(serialized.value).not.toBeNull();

        expect(serialized.value).toBe(`{"hellO":"WOrld"}`);

        const deserialized = codec.deserialize(serialized.value);
        expect(deserialized.error).toBeUndefined();
        expect(deserialized.hasError).toBeFalsy();
        expect(deserialized.hasValue).toBeTruthy();
        expect(deserialized.value).not.toBeNull();

        expect(deserialized.value).toEqual(testObject);
    });

    it("Should throw an error when deserializing invalid JSON", () => {
        const codec = new JsonCodec();

        const invalidJson = `{"hellO": "WOrld"`;

        const deserialized = codec.deserialize(invalidJson);
        expect(deserialized.error).toBeInstanceOf(CodecError);
        expect(deserialized.hasError).toBeTruthy();
        expect(deserialized.hasValue).toBeFalsy();
    });
});
