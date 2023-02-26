import { GraphQLFormattedError } from "graphql";
import * as React from "react";

interface UseQueryOptions<T> {
    variables?: { [key: string]: any };
    defaultValue?: T
    onSuccess?: (data: T, errors: GraphQLFormattedError[]) => any | Promise<any>;
    onError?: (error: GraphQLFormattedError[]) => any | Promise<any>;
}

export function useQuery<T>(query: string, options: UseQueryOptions<T> = {}) {
    const [data, setData] = React.useState<T>(options.defaultValue);
    const [errors, setErrors] = React.useState<GraphQLFormattedError[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [forceUpdateValue, forceUpdate] = React.useReducer(x => x + 1, 0);

    React.useEffect(() => {
        setLoading(true);
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
            options.onSuccess?.(fetchedData.data, fetchedData.errors);
            setData(fetchedData.data);
            setErrors(fetchedData.errors);
            setLoading(false);
        }).catch(err => {
            options.onError?.(err);
            setErrors([err.message]);
            setData(null);
            setLoading(false);
        });
    }, [query, options.variables, forceUpdateValue]);

    return {
        data,
        errors,
        loading,
        forceUpdate
    };
}

interface UseMutationOptions<T> {
    variables?: { [key: string]: any };
    defaultValue?: T
    onSuccess?: (data: T, errors: GraphQLFormattedError[]) => any | Promise<any>;
    onError?: (error: GraphQLFormattedError[]) => any | Promise<any>;
}

export function useMutation<T>(mutation: string, options: UseMutationOptions<T> = {}) {
    const [data, setData] = React.useState<T>(options.defaultValue || null);
    const [variables, setVariables] = React.useState(options.variables || {});
    const [errors, setErrors] = React.useState<GraphQLFormattedError[]>([]);
    const [loading, setLoading] = React.useState<boolean>(false);

    React.useEffect(() => {
        if(!loading) {
            return;
        }

        fetch("/api/core.graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query: mutation,
                variables
            })
        }).then(res => res.json()).then(async fetchedData => {
            await options.onSuccess?.(fetchedData.data, fetchedData.errors);
            setData(fetchedData.data);
            setErrors(fetchedData.errors);
            setLoading(false);
        }).catch(async err => {
            await options.onError?.(err);
            setData(null);
            setLoading(false);
        });

        setLoading(true);
    }, [loading, mutation, variables]);

    return {execute: (variables: any = null) => {
        if(variables) {
            setVariables(variables);
        }

        setLoading(true);
    }, data, errors, loading, setVariables};
}
