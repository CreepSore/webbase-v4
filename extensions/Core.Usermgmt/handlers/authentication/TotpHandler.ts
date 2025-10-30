import * as crypto from "crypto";

/**
 * Adapted code from https://github.com/robbryandev/vanilla-totp
 */
export default class TotpHandler {
    private static base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    static getTotp(
        secret: string,
        timestamp = Date.now(),
        digits = 6,
        interval = 30,
    ): string {
        const time = Math.floor(timestamp / 1000 / interval);

        const paddedCounter = Buffer.alloc(8);
        paddedCounter.writeUInt32BE(time, 4);

        const hmac = this.getHmac(this.base32Decode(secret), paddedCounter, "sha1");

        const trunc = this.dynamicTruncation(hmac) % 10 ** digits;
        const code = trunc.toString().padStart(digits, "0");

        return code;
    }

    static validate(
        input: string,
        secret: string,
        timestamp = Date.now(),
        digits = 6,
        interval = 30,
    ): boolean {
        for(let i = -1; i < 1; i++) {
            const offsettedDate = timestamp - (interval * 1000 * i);
            if(this.getTotp(secret, offsettedDate, digits, interval) === input) {
                return true;
            }
        }

        return false;
    }

    private static dynamicTruncation(hmac: Buffer): number {
        const offset = hmac[hmac.length - 1] & 0xf;
        const binCode =
            ((hmac[offset] & 0x7f) << 24) |
            ((hmac[offset + 1] & 0xff) << 16) |
            ((hmac[offset + 2] & 0xff) << 8) |
            (hmac[offset + 3] & 0xff);

        return binCode;
    }

    private static base32Decode(encoded: string): Buffer {
        let binaryString = "";

        for (let i = 0; i < encoded.length; i++) {
            const char = encoded.charAt(i).toUpperCase();
            const charIndex = this.base32Chars.indexOf(char);

            if(charIndex === -1) continue;

            binaryString += charIndex.toString(2).padStart(5, "0");
        }

        // Convert the binary string to a buffer
        const bytes = [];
        for (let i = 0; i < binaryString.length; i += 8) {
            bytes.push(parseInt(binaryString.slice(i, i + 8), 2));
        }

        // Return the buffer
        return Buffer.from(bytes);
    }

    private static getHmac(secret: crypto.BinaryLike | crypto.KeyObject, time: crypto.BinaryLike, algorithm: string): Buffer {
        return crypto.createHmac(algorithm, secret).update(time).digest();
    }
}
