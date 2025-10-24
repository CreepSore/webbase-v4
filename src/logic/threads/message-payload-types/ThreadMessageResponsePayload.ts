type ThreadMessageResponsePayload<TResponsePayload> = {
    responseToId: string;
    payload: TResponsePayload;
}

export default ThreadMessageResponsePayload;
