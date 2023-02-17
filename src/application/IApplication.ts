/**
 * Application interface for entry points.
 */
export default interface IApplication {
    start: () => Promise<void>;
    stop: () => Promise<void>;
}
