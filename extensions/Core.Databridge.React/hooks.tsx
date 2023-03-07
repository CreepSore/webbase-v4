import DatabridgePacket from "@extensions/Core.Databridge/DatabridgePacket";
import IDatabridgePacket from "@extensions/Core.Databridge/IDatabridgePacket";
import IDatabridgeClientProtocol from "@extensions/Core.Databridge/protocols/IDatabridgeClientProtocol";
import React from "react";

interface UseDatabridgeSyncProperyOptions<T> {
    databridge: IDatabridgeClientProtocol;
    key: string;
    defaultValue?: T;
}

export function useDatabridgeSyncPropery<T>(options: UseDatabridgeSyncProperyOptions<T>): [T, (newValue: T) => void] {
    const [value, setValue] = React.useState<T>(options.defaultValue ?? null);

    React.useEffect(() => {
        if(!options.databridge) return;

        const packetCallback = (packet: IDatabridgePacket<any>) => {
            if(packet.type === "STATE.UPDATE") {
                let stateUpdatePacket = packet as IDatabridgePacket<{key: string, value: T}>;
                if(stateUpdatePacket.data.key === options.key) {
                    setValue(stateUpdatePacket.data.value);
                }
            }
        };

        options.databridge.onPacketReceived(packetCallback);

        return () => {
            options.databridge.removePacketReceived(packetCallback);
        };
    }, [options.databridge]);

    return [value, (newValue: T) => {
        setValue(newValue);
        options.databridge?.sendPacket?.(new DatabridgePacket("STATE.UPDATE", {key: options.key, value: newValue}, {}));
    }];
}