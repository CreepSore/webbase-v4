interface IThreadMessage<TPayload, TType extends string = string> {
    id: string;
    type: TType;
    payload: TPayload;
}

export default IThreadMessage;
