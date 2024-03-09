import * as React from "react";
import DataStream from "../DataStream/DataStream";

type useDataStreamReturnType = {
    receive: DataStream["receive"],
    removeReceiveListener: DataStream["removeReceiveListener"],
    receiveType: DataStream["receiveType"],
    removeReceiveTypeListener: DataStream["removeReceiveTypeListener"],
    send: DataStream["send"],
};

export type {
    useDataStreamReturnType,
};

export default function useDataStream(): useDataStreamReturnType {
    const events = React.useRef<Map<string, Function[]>>(new Map());
    const [dataStream, setDataStream] = React.useState(new DataStream());

    const receive: DataStream["receive"] = <ValueType = any>(callback: any): void => {
        if(!events.current.has("receive")) {
            events.current.set("receive", []);
        }

        events.current.get("receive").push(callback);
        dataStream.receive(callback);
    };

    const removeReceiveListener: DataStream["removeReceiveListener"] = (callback: any): void => {
        events.current.set("receive", events.current.get("receive").filter(e => e === callback));
        dataStream.removeReceiveListener(callback);
    };

    const receiveType: DataStream["receiveType"] = <KeyType extends string, ValueType = any>(type: any, callback: any): void => {
        if(!events.current.has(`receive-type-${type}`)) {
            events.current.set(`receive-type-${type}`, []);
        }

        events.current.get(`receive-type-${type}`).push(callback);
        dataStream.receiveType(type, callback);
    };

    const removeReceiveTypeListener: DataStream["removeReceiveTypeListener"] = (type: any, callback: any): void => {
        events.current.set(`receive-type-${type}`, events.current.get(`receive-type-${type}`).filter(e => e === callback));
        dataStream.removeReceiveTypeListener(type, callback);
    };

    React.useEffect(() => {
        return () => {
            [...events.current.get("receive")].forEach(e => {
                // @ts-ignore
                removeReceiveListener(e);
            });

            [...events.current]
                .filter(e => e[0].startsWith("receive-type-"))
                .forEach(e => {
                    // @ts-ignore
                    removeReceiveTypeListener(e[0].substring(13), e[1]);
                });
        };
    }, []);

    return {
        receive,
        removeReceiveListener,
        receiveType,
        removeReceiveTypeListener,
        send: (...args) => dataStream.send(...args),
    };
}
