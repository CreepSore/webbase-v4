import React from "react";
import IDatabridgePacket from "./IDatabridgePacket";
import DatabridgeWebsocketClient from "./protocols/client/DatabridgeWebsocketClient";

const databridges = new Map<string, DatabridgeWebsocketClient>();

interface UseDatabridgeConfig {
    name: string;
    url: string;
    /**
     * @description Default: true
     */
    autoconnect?: boolean;
    /**
     * @description Default: true
     */
    reconnect?: boolean;
    /**
     * @description Default: 5000ms
     */
    reconnectInterval?: number;

    onConnected?: (databridge: DatabridgeWebsocketClient) => void;
    onDisconnected?: (databridge: DatabridgeWebsocketClient) => void;
    onPacketReceived?: <T = any, T2 = any>(packet: IDatabridgePacket<T, T2>, databridge: DatabridgeWebsocketClient) => void;
}

export function useDatabridge(config: UseDatabridgeConfig): [DatabridgeWebsocketClient, boolean] {
    const [isConnected, setIsConnected] = React.useState(false);
    const databridgeRef = React.useRef(new DatabridgeWebsocketClient(config.url));
    const reconnectRef = React.useRef(null);

    React.useEffect(() => {
        databridges.set(config.name, databridgeRef.current);

        databridgeRef.current.onConnected(() => {
            if(reconnectRef.current) {
                clearInterval(reconnectRef.current);
                reconnectRef.current = null;
            }

            setIsConnected(true);
            config.onConnected?.(databridgeRef.current);
        });

        databridgeRef.current.onDisconnected(() => {
            setIsConnected(false);
            config.onDisconnected?.(databridgeRef.current);

            if((config.reconnect ?? true) && !reconnectRef.current) {
                reconnectRef.current = setInterval(() => {
                    databridgeRef.current.connect();
                }, config.reconnectInterval ?? 5000);
            }
        });

        databridgeRef.current.onPacketReceived(packet => {
            config.onPacketReceived?.(packet, databridgeRef.current);
        });

        databridgeRef.current.connect();

        return () => {
            if(reconnectRef.current) {
                clearInterval(reconnectRef.current);
                reconnectRef.current = null;
            }

            databridges.delete(config.name);
            databridgeRef.current.disconnect();
        };
    }, []);

    return [databridgeRef.current, isConnected];
}

export function useExistingDatabridge(config: {databridgeName: string}): DatabridgeWebsocketClient {
    return databridges.get(config.databridgeName);
}
interface UseDatabridgePacketConfig<T = any, T2 = any> {
    /**
     * @description Either use this or databridge
     */
    databridgeName?: string;
    /**
     * @description Either use this or databridgeName
     */
    databridge?: DatabridgeWebsocketClient;
    defaultPacket?: IDatabridgePacket<T, T2>;
    preSend?: IDatabridgePacket<any, any>[];
    filter: (packet: IDatabridgePacket<T, T2>) => boolean;
}

export function useDatabridgePacket<T = any, T2 = any>(config: UseDatabridgePacketConfig<T, T2>): IDatabridgePacket<T, T2> {
    const [lastPacket, setLastPacket] = React.useState<IDatabridgePacket<T, T2>>(config.defaultPacket ?? null);
    const databridge = config.databridgeName ? databridges.get(config.databridgeName) : config.databridge;

    const onDataReceived = (packet: IDatabridgePacket<T, T2>): void => {
        if(config.filter(packet)) {
            setLastPacket(packet);
        }
    };

    const requestData = (): any => {
        if(config.preSend && Array.isArray(config.preSend)) {
            config.preSend.forEach(packet => {
                databridge?.sendPacket(packet);
            });
        }

        databridge?.onPacketReceived(onDataReceived);

        return () => {
            databridge?.removePacketReceived(onDataReceived);
        };
    };

    React.useEffect(() => {
        if(!databridge) return;
        if(databridge.isConnected) {
            return requestData();
        }

        databridge.onConnected(() => {
            requestData();
        });
    }, [databridge]);

    return lastPacket;
}

interface UseDatabridgePacketDataConfig<T = any, T2 = any> {
    /**
     * @description Either use this or databridge
     */
    databridgeName?: string;
    /**
     * @description Either use this or databridgeName
     */
    databridge?: DatabridgeWebsocketClient;
    defaultData?: T;
    preSend?: IDatabridgePacket<any, any>[];
    filter: (packet: IDatabridgePacket<T, T2>) => boolean;
}

export function useDatabridgePacketData<T = any, T2 = any>(config: UseDatabridgePacketDataConfig<T, T2>): T {
    const packet = useDatabridgePacket<T, T2>({
        ...config,
    });

    return packet?.data ?? config.defaultData ?? null;
}
