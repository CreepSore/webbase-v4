import * as React from "react";
import FullNavigator from "./FullNavigator";

interface UseNavigationHandlerOptions<NavigationKeyType, NavigationArgumentsType> {
    defaultPage: NavigationKeyType;
    /** default 'true' */
    persistCurrentPage?: boolean;
    shouldHandleNavigationRequest?: (navigationKey: NavigationKeyType, navigationArguments: NavigationArgumentsType) => boolean;
}

export default function useNavigationHandler<
    NavigationKeyType extends string,
    NavigationArgumentsType = any
>(options: UseNavigationHandlerOptions<NavigationKeyType, NavigationArgumentsType>): FullNavigator<NavigationKeyType, NavigationArgumentsType> {
    const [currentPage, setCurrentPage] = React.useState<NavigationKeyType>(options.defaultPage);
    const [currentArgs, setCurrentArgs] = React.useState<NavigationArgumentsType>(null as NavigationArgumentsType);
    const [persistCurrentPage, setPersistCurrentPage] = React.useState(options.persistCurrentPage ?? true);
    const [pageStack, setPageStack] = React.useState<Array<{
        navKey: NavigationKeyType,
        args: NavigationArgumentsType
    }>>([]);

    const doNavigationRequest = (key: NavigationKeyType, args: NavigationArgumentsType): void => {
        if(
            options.shouldHandleNavigationRequest
            && options.shouldHandleNavigationRequest(key, args)
        ) {
            return;
        }

        setPageStack([...pageStack, {navKey: currentPage, args: currentArgs}]);
        setCurrentPage(key);
        setCurrentArgs(args);

        if(persistCurrentPage) {
            location.hash = key;
        }
    };

    const doBackRequest = (): boolean => {
        if(pageStack.length === 0) {
            return false;
        }

        const previousPage = pageStack[pageStack.length - 1];
        const newStack = pageStack.splice(pageStack.length - 1);

        setPageStack(newStack);
        setCurrentPage(previousPage.navKey);
        setCurrentArgs(previousPage.args);
        return true;
    };

    const forceCurrentPage = (page: NavigationKeyType): void => {
        setCurrentPage(page);

        if(persistCurrentPage) {
            location.hash = page;
        }
    };

    const updateCurrentArguments = (args: NavigationArgumentsType): void => {
        setCurrentArgs(args);
    };

    React.useEffect(() => {
        const callback = (event: PopStateEvent):void => {
            const hash = location.hash.substring(1);
            if(!doBackRequest() && hash) {
                forceCurrentPage(hash as NavigationKeyType);
            }
        };

        window.addEventListener("popstate", callback);

        return () => {
            window.removeEventListener("popstate", callback);
        };
    }, []);

    return {
        currentPage,
        currentArguments: currentArgs,
        forceCurrentPage,
        doBackRequest,
        doNavigationRequest,
        doForwardsRequest: () => {},
        updateCurrentArguments,
        pageStack,
    };
}
