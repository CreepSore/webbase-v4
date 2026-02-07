/* eslint-disable no-loop-func */
import EnvironmentFile from "./EnvironmentFile";

enum Tokens {
    NULL = "NULL",
    WHITESPACE = "WHITESPACE",
    ANY = "ANY",
    NAME = "NAME",
    EQUALS = "EQUALS",
    COMMENT_START = "COMMENT_START",
    QUOTE = "QUOTE",
    SINGLE_QUOTE = "SINGLE_QUOTE",
    BACKTICK = "BACKTICK",
}

const tokenParsers = {
    [Tokens.ANY]: /^./,
    [Tokens.WHITESPACE]: /^ +/,
    [Tokens.NAME]: /^[a-zA-Z0-9_]+/,
    [Tokens.QUOTE]: /^\"/,
    [Tokens.SINGLE_QUOTE]: /^\'/,
    [Tokens.BACKTICK]: /^\`/,
    [Tokens.EQUALS]: /^=/,
    [Tokens.COMMENT_START]: /^#/,
} as const;

type Expectation = {
    token: Tokens,
    /** @default false */
    continue?: boolean,
    /**
     * @returns True if the matched chars should be consumed
     */
    onMatch: (value: string) => boolean,
    /**
     * Gets called when no match has been successful
     */
    onNullMatch?: () => void,
    lineFinished?: () => void,
};

type ParsedEnvironmentLine = {
    name: string;
    value: string;
};

export default class EnvironmentFileParser {
    private data: string[];
    private currentLine?: string;
    private currentLineOffset?: number;
    private currentLineIndex?: number;

    constructor(buffer: Buffer) {
        this.data = buffer.toString().replace(/\r/g, "").split("\n").map(l => l.trim());
    }

    parse(): EnvironmentFile {
        const result = new EnvironmentFile();

        for(let i = 0; i < this.data.length; i++) {
            this.currentLineIndex = i;
            const line = this.data[i];

            if(!line) {
                continue;
            }

            if(line.startsWith("#")) {
                continue;
            }

            const parsedLine = this.parseLine(line);
            result.addMapping(parsedLine.name, parsedLine.value);
        }

        return result;
    }

    private parseLine(line: string): ParsedEnvironmentLine {
        this.currentLine = line;
        this.currentLineOffset = 0;

        const result: Partial<ParsedEnvironmentLine> = {};
        let expectEndQuoteToken: Expectation;
        let lineFinished = false;

        this.expect([
            {
                token: Tokens.NAME,
                onMatch: (value) => {
                    result.name = value;
                    return true;
                },
            },
        ]).expect([
            {
                token: Tokens.WHITESPACE,
                onMatch: () => true,
                "continue": true,
            },
            {
                token: Tokens.EQUALS,
                onMatch: () => true,
            },
        ]).expect([
            {
                token: Tokens.WHITESPACE,
                onMatch: () => true,
                "continue": true,
                lineFinished: () => (lineFinished = true),
            },
            {
                token: Tokens.QUOTE,
                onMatch: () => {
                    expectEndQuoteToken = {
                        token: Tokens.QUOTE,
                        onMatch: () => true,
                    };
                    return true;
                },
            },
            {
                token: Tokens.SINGLE_QUOTE,
                onMatch: () => {
                    expectEndQuoteToken = {
                        token: Tokens.SINGLE_QUOTE,
                        onMatch: () => true,
                    };
                    return true;
                },
            },
            {
                token: Tokens.BACKTICK,
                onMatch: () => {
                    expectEndQuoteToken = {
                        token: Tokens.BACKTICK,
                        onMatch: () => true,
                    };
                    return true;
                },
            },
            {
                token: Tokens.NULL,
                onMatch: () => false,
                onNullMatch: () => {},
            },
        ]);

        if(expectEndQuoteToken!) {
            expectEndQuoteToken.onMatch = () => {
                lineFinished = true;
                return true;
            };

            expectEndQuoteToken.lineFinished = () => (lineFinished = true);
            expectEndQuoteToken.continue = true;
        }

        while(!lineFinished) {
            this.expect([
                expectEndQuoteToken!,
                {
                    token: Tokens.COMMENT_START,
                    onMatch: (value) => {
                        if(!expectEndQuoteToken) {
                            lineFinished = true;
                            result.value += value;
                        }
                        return true;
                    },
                    lineFinished: () => {
                        lineFinished = true;
                    },
                },
                {
                    token: Tokens.ANY,
                    onMatch: (value) => {
                        result.value = result.value
                            ? `${result.value}${value}`
                            : value;

                        return true;
                    },
                },
            ]);
        }

        if(!result.value) {
            result.value = "";
        }
        else if(!expectEndQuoteToken!) {
            result.value = result.value.trim();
        }

        if(expectEndQuoteToken!?.token === Tokens.BACKTICK) {
            result.value = result.value
                .replace(/\\n/g, "\n")
                .replace(/\\r/g, "\r");
        }

        return result as ParsedEnvironmentLine;
    }

    private expect(expectations: Array<Expectation | null>): this {
        let nullExpectation: Expectation | null = null;

        if(!this.currentLine || this.currentLineOffset === undefined || this.currentLineIndex === undefined) {
            return this;
        }

        for(const expectation of expectations) {
            if(!expectation) {
                continue;
            }

            if(expectation.token === Tokens.NULL) {
                nullExpectation = expectation;
                continue;
            }

            const currentLine = this.currentLine.substring(this.currentLineOffset);
            if(!currentLine) {
                if(expectation.lineFinished) {
                    expectation.lineFinished?.();
                    return this;
                }

                break;
            }

            const match = currentLine.match(tokenParsers[expectation.token]);
            if(!match) {
                continue;
            }

            if(expectation.onMatch(match[0])) {
                this.currentLineOffset += match[0].length;
            }

            if(expectation.continue !== true) {
                return this;
            }
        }

        if(nullExpectation?.onNullMatch) {
            nullExpectation.onNullMatch();
            return this;
        }

        throw this._error(`Expected one of: [${expectations.map(e => e?.token).join(", ")}]`);
    }

    private _error(message: string): Error {
        return new Error(`Failed to parse line - ${message}:
    LineNr = [${this.currentLineIndex}]
    RemainingLine = [${(this.currentLine || "").substring(this.currentLineOffset || 0)}]
    Offset = [${this.currentLineOffset}]
    Line = [${this.currentLine}]`)
    }
}
