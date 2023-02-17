import * as React from "react";

interface UseQueryOptions<T> {
    variables?: { [key: string]: any };
    defaultValue: T
}

export function useQuery<T>(query: string, options: UseQueryOptions<T>) {
    const [data, setData] = React.useState<T>(options.defaultValue);
    const [errors, setErrors] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const forceUpdate = React.useReducer(x => x + 1, 0);

    React.useEffect(() => {
        fetch("/api/core.graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query: query,
                variables: options.variables
            })
        }).then(res => res.json()).then(fetchedData => {
            setData(fetchedData.data);
            setErrors(fetchedData.errors);
            setLoading(false);
        }).catch(err => {
            setErrors([err.message]);
            setData(null);
            setLoading(false);
        });
    }, [query, options.variables]);

    return {
        data,
        errors,
        loading,
        forceUpdate
    };
}
