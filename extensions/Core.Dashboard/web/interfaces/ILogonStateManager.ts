export default interface ILogonStateManager {
    onLoginSuccess?(): void;
    onLoginFailure?(): void;
    onLogout?(): void;
}
