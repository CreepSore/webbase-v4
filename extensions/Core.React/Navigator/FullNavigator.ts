import INavigator from "./INavigator";

type FullNavigator<KeyType extends string, ArgumentsType> = INavigator<KeyType, ArgumentsType> & {
    currentPage: KeyType,
    currentArguments: ArgumentsType,
    forceCurrentPage: (page: KeyType) => void,
    pageStack: Array<{
        navKey: KeyType,
        args: ArgumentsType
    }>,
};

export default FullNavigator;
