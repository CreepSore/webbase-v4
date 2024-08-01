import * as React from "react";

type UseDelayedLoaderProps = {
    deps: React.DependencyList,
    /** Default delay = 1000ms */
    delay?: number,
};

export default function useDelayedLoader(
    props: UseDelayedLoaderProps,
): boolean {
    const loadingRef = React.useRef<any>();
    const [isLoaderVisible, setIsLoaderVisible] = React.useState(false);
    React.useEffect(() => {
        const isLoading = props.deps.some(Boolean);

        if(isLoading) {
            if(loadingRef.current) {
                return;
            }

            loadingRef.current = setTimeout(() => {
                setIsLoaderVisible(true);
            }, props.delay > 0 ? props.delay : 1000);
            return;
        }

        clearTimeout(loadingRef.current);
        setIsLoaderVisible(false);

        return () => clearTimeout(loadingRef.current);
    }, props.deps);

    return isLoaderVisible;
}
