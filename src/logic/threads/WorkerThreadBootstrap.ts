import WorkerThreadSubprocess from "./WorkerThreadSubprocess";

const main = async() => {
    const workerThreadSubprocess = new WorkerThreadSubprocess();
    await workerThreadSubprocess.start();
};

main();
