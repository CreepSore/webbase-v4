import IDatabridge from "./IDatabridge";

export default interface IDatabridgeStartable {
    start?(databridge: IDatabridge): Promise<void>;
    stop?(databridge: IDatabridge): Promise<void>;
}
