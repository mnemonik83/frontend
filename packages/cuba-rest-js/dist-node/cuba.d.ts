import { EnumInfo, MetaClassInfo, PermissionInfo, UserInfo } from "./model";
import { DefaultStorage } from "./storage";
export * from './model';
export * from './storage';
export declare function initializeApp(config: AppConfig): CubaApp;
export declare function getApp(appName?: string): CubaApp;
export interface AppConfig {
    apiUrl: string;
    name?: string;
    restClientId?: string;
    restClientSecret?: string;
    defaultLocale?: string;
}
export interface ResponseError extends Error {
    response?: any;
}
export declare type ContentType = "text" | "json" | "blob";
export interface FetchOptions extends RequestInit {
    handleAs?: ContentType;
}
export interface EntitiesLoadOptions {
    view?: string;
    sort?: string;
    limit?: number;
    offset?: number;
}
export declare class CubaApp {
    name: string;
    apiUrl: string;
    restClientId: string;
    restClientSecret: string;
    defaultLocale: string;
    private storage;
    private static REST_TOKEN_STORAGE_KEY;
    private static USER_NAME_STORAGE_KEY;
    private static LOCALE_STORAGE_KEY;
    messagesCache: any[];
    enumsCache: any[];
    private tokenExpiryListeners;
    private messagesLoadingListeners;
    private enumsLoadingListeners;
    private localeChangeListeners;
    constructor(name?: string, apiUrl?: string, restClientId?: string, restClientSecret?: string, defaultLocale?: string, storage?: DefaultStorage);
    restApiToken: string;
    locale: string;
    login(login: string, password: string): Promise<{
        access_token: string;
    }>;
    logout(): Promise<any>;
    revokeToken(token: string): Promise<any>;
    loadEntities(entityName: any, options?: EntitiesLoadOptions): Promise<any[]>;
    loadEntity(entityName: any, id: any, options?: {
        view?: string;
    }): Promise<any>;
    deleteEntity(entityName: any, id: any): Promise<any>;
    commitEntity(entityName: string, entity: any): Promise<any>;
    invokeService(serviceName: string, methodName: string, params: any, fetchOptions?: FetchOptions): Promise<any>;
    query(entityName: string, queryName: string, params?: any): Promise<any>;
    queryCount(entityName: string, queryName: string, params?: any): Promise<any>;
    loadMetadata(): Promise<MetaClassInfo[]>;
    loadEntityMetadata(entityName: string): Promise<MetaClassInfo>;
    loadEntitiesMessages(): Promise<any>;
    loadEnums(): Promise<EnumInfo[]>;
    getPermissions(): Promise<PermissionInfo[]>;
    getUserInfo(): Promise<UserInfo>;
    fetch(method: any, path: any, data?: any, fetchOptions?: FetchOptions): Promise<any>;
    onLocaleChange(c: any): () => ((locale: string) => {})[];
    onTokenExpiry(c: any): () => (() => {})[];
    onEnumsLoaded(c: any): () => ((enums: any[]) => {})[];
    onMessagesLoaded(c: any): () => ((messages: any[]) => {})[];
    private isTokenExpiredResponse(resp);
    private _getBasicAuthHeaders();
    private checkStatus(response);
    private clearAuthData();
}
