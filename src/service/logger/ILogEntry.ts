export default interface ILogEntry {
    id: string;
    date: Date;
    level?: string;
    lines: string[];
    infos: string[];
    objects: {[key: string]: any};
}
