export function runPlatformDependent<T>(callbacks: {
    aix?: (platform: string) => T,
    android?: (platform: string) => T,
    darwin?: (platform: string) => T,
    freebsd?: (platform: string) => T,
    haiku?: (platform: string) => T,
    linux?: (platform: string) => T,
    openbsd?: (platform: string) => T,
    sunos?: (platform: string) => T,
    win32?: (platform: string) => T,
    cygwin?: (platform: string) => T,
    netbsd?: (platform: string) => T
}): T {
    const callbackToRun = callbacks[process.platform];
    if(!callbackToRun) {
        throw new Error("Unsupported platform");
    }

    return callbackToRun(process.platform);
}
