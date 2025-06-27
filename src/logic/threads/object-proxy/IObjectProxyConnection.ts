export default interface IObjectProxyConnection {
    call<TReturnType>(functionName: string): Promise<TReturnType>;
    call<TReturnType, TArgs extends any[] = any[]>(functionName: string, ...args: TArgs): Promise<TReturnType>;
    
    get<TReturnType>(propertyName: string): Promise<TReturnType>;
    set<TReturnType, TValue = any>(propertyName: string, value: TValue): Promise<TReturnType>;
}
