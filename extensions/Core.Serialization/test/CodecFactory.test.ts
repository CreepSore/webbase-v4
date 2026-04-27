import JsonCodec from "../JsonCodec";
import CodecFactory from "../CodecFactory";
import ByteCodec from "../ByteCodec";

describe("CodecFactory Test", () => {
    it("Should serialize and deserialize correctly", () => {
        const factory = new CodecFactory()
            .defineSerializer("json", Object, new JsonCodec())
            .defineDeserializer("json", Object, new JsonCodec())
            .defineSerializer("byte", Object, new ByteCodec([
                "hellO" as keyof Object,
            ], [
                "string"
            ]))
            .defineDeserializer("byte", Object, new ByteCodec([
                "hellO" as keyof Object,
            ], [
                "string"
            ]));

        const testObject = {
            hellO: "WOrld",
        };

        const serializer = factory.getSerializer<any, string>("json", Object);
        const deserializer = factory.getDeserializer<any, string>("json", Object);
        expect(serializer).toBeInstanceOf(JsonCodec);
        expect(deserializer).toBeInstanceOf(JsonCodec);

        const serialized = serializer!.serialize(testObject);
        expect(serialized.error).toBeUndefined();
        expect(serialized.hasError).toBeFalsy();
        expect(serialized.hasValue).toBeTruthy();
        expect(serialized.value).not.toBeNull();

        expect(serialized.value).toBe(`{"hellO":"WOrld"}`);

        const deserialized = deserializer!.deserialize(serialized.value);
        expect(deserialized.error).toBeUndefined();
        expect(deserialized.hasError).toBeFalsy();
        expect(deserialized.hasValue).toBeTruthy();
        expect(deserialized.value).not.toBeNull();

        expect(deserialized.value).toEqual(testObject);

        const byteSerializer = factory.getSerializer<any, Uint8Array>("byte", Object);
        const byteDeserializer = factory.getDeserializer<any, Uint8Array>("byte", Object);
        expect(byteSerializer).toBeInstanceOf(ByteCodec);
        expect(byteDeserializer).toBeInstanceOf(ByteCodec);

        const byteSerialized = byteSerializer!.serialize(testObject);
        expect(byteSerialized.error).toBeUndefined();
        expect(byteSerialized.hasError).toBeFalsy();
        expect(byteSerialized.hasValue).toBeTruthy();
        expect(byteSerialized.value).toBeInstanceOf(Uint8Array);

        const byteDeserialized = byteDeserializer!.deserialize(byteSerialized.value);
        expect(byteDeserialized.error).toBeUndefined();
        expect(byteDeserialized.hasError).toBeFalsy();
        expect(byteDeserialized.hasValue).toBeTruthy();
        expect(byteDeserialized.value).not.toBeNull();

        expect(byteDeserialized.value).toEqual(testObject);
    });
});
