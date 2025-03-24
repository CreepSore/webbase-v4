type StructureAssertionBase = String | Number | Boolean | Date | string | number | boolean | object | null | undefined | ((value: any) => boolean);
type StructureAssertionLayer = StructureAssertionBase | { [key: string]: StructureAssertionLayer } | [StructureAssertionBase];
type StructureAssertion = StructureAssertionLayer;

export function tryAssertStructure<T>(is: T, expected: StructureAssertion): T {
    if (!assertStructure(is, expected)) {
        return null;
    }

    return is;
}

export default function assertStructure(is: any, expected: StructureAssertion): boolean {
    if (is === expected) {
        return true;
    }

    const preCheck = expected;

    if(typeof preCheck === "function" && preCheck !== String && preCheck !== Number && preCheck !== Boolean && preCheck !== Date) {
        if (!(preCheck as (value: any) => boolean)(is)) {
            return false;
        }
    }

    if(Array.isArray(is)) {
        if(!Array.isArray(expected)) {
            return false;
        }

        for(let i = 0; i < is.length; i++) {
            if(!assertStructure(is[i], expected[0])) {
                return false;
            }
        }

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

            const check = expected[key as keyof typeof expected];

            if(typeof check === "function" && check !== String && check !== Number && check !== Boolean && check !== Date) {
                if (!(check as (value: any) => boolean)(is[key])) {
                    return false;
                }

                continue;
            }

            if (!assertStructure(is[key], check)) {
                return false;
            }
        }

        return true;
    }

    return true;
}
