import React from "react";
import DataStreamContext from "../DataStream/DataStreamContext";
import { IDataStreamData } from "../DataStream/DataStream";

type UseDataStreamEventConfig<T> = {
    callback?: (data: T) => any;
    defaultData?: T | null;
};

export default function useDataStreamEvent<DataType>(type: string | RegExp, config: UseDataStreamEventConfig<DataType>): DataType {
    const [data, setData] = React.useState<DataType>(config.defaultData ?? null);
    const dataStream = React.useContext(DataStreamContext);

    React.useEffect(() => {
        const dataStreamEventCallback = (event: IDataStreamData<any, DataType>): void => {
            const isValid = (
                typeof type === "string"
                && type === event.type
            ) || (
                typeof type !== "string"
                && type.test(event.type)
            );

            if(!isValid) {
                return;
            }

            setData(event.data);
            config.callback?.(event.data);
        };

        dataStream.receive<DataType>(dataStreamEventCallback);

        return () => {
            dataStream.removeReceiveListener(dataStreamEventCallback);
        };
    });

    return data;
}
