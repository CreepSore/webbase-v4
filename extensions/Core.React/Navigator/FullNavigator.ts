import INavigator from "./INavigator";

type FullNavigator<KeyType extends string, ArgumentsType> = INavigator<KeyType, ArgumentsType> & {
    currentPage: KeyType,
    currentArguments: ArgumentsType,
    forceCurrentPage: (page: KeyType) => void,
};

export default FullNavigator;
