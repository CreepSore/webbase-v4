import * as React from "react";
import INavigator from "./INavigator";
import FullNavigator from "./FullNavigator";

interface UseNavigationHandlerOptions<NavigationKeyType, NavigationArgumentsType> {
    defaultPage: NavigationKeyType;
    shouldHandleNavigationRequest?: (navigationKey: NavigationKeyType, navigationArguments: NavigationArgumentsType) => boolean;
}

export default function useNavigationHandler<
    NavigationKeyType extends string,
    NavigationArgumentsType = any
>(options: UseNavigationHandlerOptions<NavigationKeyType, NavigationArgumentsType>): FullNavigator<NavigationKeyType, NavigationArgumentsType> {
    const [currentPage, setCurrentPage] = React.useState<NavigationKeyType>(options.defaultPage);
    const [currentArgs, setCurrentArgs] = React.useState<NavigationArgumentsType>(null);
    const [pageStack, setPageStack] = React.useState<Array<{
        navKey: NavigationKeyType,
        args: NavigationArgumentsType
    }>>([]);

    const doNavigationRequest = (key: NavigationKeyType, args: NavigationArgumentsType): void => {
        const shouldHandleRequest = options.shouldHandleNavigationRequest?.(key, args);
        if(!shouldHandleRequest && !options.shouldHandleNavigationRequest) {
            return;
        }

        setPageStack([...pageStack, {navKey: currentPage, args: currentArgs}]);
        setCurrentPage(key);
        setCurrentArgs(args);
    };

    const doBackRequest = (): void => {
        if(pageStack.length === 0) {
            return;
        }

        const previousPage = pageStack[pageStack.length - 1];
        const newStack = pageStack.splice(pageStack.length - 1);

        setPageStack(newStack);
        setCurrentPage(previousPage.navKey);
        setCurrentArgs(previousPage.args);
    };

    const forceCurrentPage = (page: NavigationKeyType): void => {
        setCurrentPage(page);
    };

    const updateCurrentArguments = (args: NavigationArgumentsType): void => {
        setCurrentArgs(args);
    };

    return {
        currentPage,
        currentArguments: currentArgs,
        forceCurrentPage,
        doBackRequest,
        doNavigationRequest,
        doForwardsRequest: () => {},
        updateCurrentArguments,
    };
}
