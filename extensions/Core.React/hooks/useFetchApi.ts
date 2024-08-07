import * as React from "react";

type IsLoading = boolean;
type UpdateFunction<FetchedType> = () => Promise<FetchedType>;

type UseFetchApiOptions<FetchedType> = {
    onDataUpdated?: (newValue: FetchedType) => void,
    /**
     * Defines if the initial fetch request should be done automatically
     * @default true
     */
    initialUpdate?: boolean,
};

export default function useFetchApi<FetchedType>(
    fetcher: (...args: any[]) => FetchedType | Promise<FetchedType>,
    defaultValue: FetchedType,
    options?: UseFetchApiOptions<FetchedType>,
): [FetchedType, IsLoading, UpdateFunction<FetchedType>] {
    const [data, setData] = React.useState<FetchedType>(defaultValue);
    const isLoading = React.useMemo(() => data === null, [data]);

    const update = async(...args: any[]): Promise<FetchedType> => {
        let newData: FetchedType;

        try {
            newData = await fetcher(...args);
            setData(newData);
        }
        catch {
            newData = defaultValue;
            setData(defaultValue);
        }
        finally {
            options?.onDataUpdated?.(newData);
            return newData;
        }
    };

    React.useEffect(() => {
        if(options?.initialUpdate ?? true) {
            update();
        }
    }, []);

    return [data, isLoading, update];
}
