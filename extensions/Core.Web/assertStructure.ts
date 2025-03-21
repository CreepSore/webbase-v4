type StructureAssertionBase = String | Number | Boolean | Date | string | number | boolean | object | null | undefined;
type StructureAssertionLayer = StructureAssertionBase | { [key: string]: StructureAssertionLayer };
type StructureAssertion = StructureAssertionLayer;

export default function assertStructure(is: any, expected: StructureAssertion): boolean {
    if (is === expected) {
        return true;
    }

    if(typeof is === "string" && expected === String) {
        return true;
    }

    if(typeof is === "number" && expected === Number) {
        return true;
    }

    if(typeof is === "boolean" && expected === Boolean) {
        return true;
    }

    if(is instanceof Date && expected === Date) {
        return true;
    }

    if(is === expected) {
        return true;
    }

    if (typeof is !== typeof expected) {
        return false;
    }

    if (typeof expected === "object") {
        for (const key in expected) {
            if(typeof key !== "string") {
                continue;
            }

            if (!assertStructure(is[key], expected[key as keyof typeof expected])) {
                return false;
            }
        }

        return true;
    }

    return true;
}
