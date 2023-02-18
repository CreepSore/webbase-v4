import IUser from "../../../Core.Usermgmt/Interfaces/ModelTypes";

export default interface ILogonStateManager {
    onLoginSuccess?(): void;
    onLoginFailure?(): void;
    onLogout?(): void;
}
