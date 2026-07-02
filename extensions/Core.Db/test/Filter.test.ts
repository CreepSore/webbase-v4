import FilterLayerIterator from "../query/filter/FilterLayer";
import FilterLayer, { FilterLayerType } from "../query/filter/FilterLayer";

describe("Filter tests", () => {
    it("should parse the filter correctly", () => {
        const filter = new FilterLayerIterator<Human>({
            $and: [
                { $equal: { key: "name", value: "John" } },
                { $lessThan: { key: "age", value: 30 } },
                { $equal: { key: "city", value: "New York" } },
            ]
        });

        let test = "";
        filter.iterate(
            (layer, key, value) => {
                test += `${key}=${value} `;
            },
            beginLayer => {
                test += "(";
            },
            endLayer => {
                test += ")";
            },
        );

        expect(test.trim()).toBe("(name=John (age=30 city=New York))");
    });
});

class Human {
    name: string;
    age: number;
    city: string;

    constructor(name: string, age: number, city: string) {
        this.name = name;
        this.age = age;
        this.city = city;
    }
}
