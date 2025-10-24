type ExtensionControlPayload = {
    extensionName: string | "*";
    action: "load" | "start" | "loadAndStart"
}

export default ExtensionControlPayload;
