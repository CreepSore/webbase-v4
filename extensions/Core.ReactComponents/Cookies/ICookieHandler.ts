export default interface ICookieHandler {
    onCookiesAccepted(acceptedCookies: string[]): void;
    onCookiesDeclined(): void;
}
