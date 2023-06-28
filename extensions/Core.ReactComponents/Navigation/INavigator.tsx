export default interface INavigator {
    onNavigationRequest(key: string, sender?: any): void;
}
