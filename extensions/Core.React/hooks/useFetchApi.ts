import * as React from "react";

type IsLoading = boolean;
type UpdateFunction = () => void;

export default function useFetchApi<FetchedType>(
    fetcher: () => FetchedType | Promise<FetchedType>,
    defaultValue: FetchedType,
    onDataUpdated?: (newValue: FetchedType) => void,
): [FetchedType, IsLoading, UpdateFunction] {
    const [data, setData] = React.useState<FetchedType>(null);
    const isLoading = React.useMemo(() => data === null, [data]);

    const update = async(): Promise<void> => {
        setData(null);
        let newData: FetchedType;

        try {
            newData = await fetcher();
            setData(newData);
        }
        catch {
            newData = defaultValue;
            setData(defaultValue);
        }
        finally {
            onDataUpdated?.(newData);
        }
    };

    React.useEffect(() => {
        update();
    }, []);

    return [data ?? defaultValue, isLoading, update];
}
