import ObjectPool, { ObjectPoolOptions } from "../../service/utils/ObjectPool";
import Thread from "./Thread";

export type ThreadPoolOptions = Omit<ObjectPoolOptions<Thread>, "destructor">;

export default class ThreadPool extends ObjectPool<Thread> {
    constructor(options: ThreadPoolOptions) {
        super({
            ...options,
            destructor: (instance) => instance.stop().then(() => {}),
        })
    }
}
