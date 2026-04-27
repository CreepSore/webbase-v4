import IMessageFactory from "./IMessageFactory";

export default interface IMessageFactoryConsumer {
    setMessageFactory(messageFactory: IMessageFactory): void;
}
