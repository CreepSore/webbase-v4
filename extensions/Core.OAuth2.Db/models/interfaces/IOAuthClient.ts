export default interface IOAuthClient {
    id: string;

    name: string;
    secret: string;

    /**
     * Lifetime in seconds
     */
    tokenLifetime: number;

    createdAt: Date;
    modifiedAt: Date;
}
