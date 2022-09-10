import React from "react";

export function useFetchJson<T>(url: string, options: RequestInit | undefined = undefined) : [boolean, T|null, () => void] {
    let [data, setData] = React.useState<T|null>(null);
    let [loading, setLoading] = React.useState(true);

    let update = () => {
        setLoading(true);
    }

    React.useEffect(() => {
        if(!loading) return;

        fetch(url, options)
            .then(r => r.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
    }, [loading]);

    return [loading, data, update];
}
