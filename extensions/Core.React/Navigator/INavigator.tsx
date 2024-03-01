export default interface INavigator<KeyTypes extends string = string, ArgumentsType = any> {
    doNavigationRequest(navigationKey: KeyTypes, navigationArgs: ArgumentsType): void;
    doBackRequest(): void;
    doForwardsRequest(): void;
    updateCurrentArguments(newArguments: ArgumentsType): void;
}
