import { AxiosError, AxiosInstance } from 'axios';
import { IdentifoConfig } from '../types/types';
import { AppSettingsResponse, EnableTFAResponse, LoginResponse, SuccessResponse, UpdateUser, User, ApiRequestError } from './model';
export declare class Api {
    authInstance: AxiosInstance;
    catchHandler: (e: AxiosError<ApiRequestError>) => never;
    constructor(config: IdentifoConfig);
    getUser(token: string): Promise<User>;
    renewToken(token: string): Promise<LoginResponse>;
    updateUser(user: UpdateUser, token: string): Promise<User>;
    login(username: string, password: string, deviceToken: string, scopes: string[]): Promise<LoginResponse>;
    register(username: string, password: string, email: string, phone: string): Promise<LoginResponse>;
    requestResetPassword(email: string): Promise<SuccessResponse>;
    resetPassword(password: string, token: string): Promise<SuccessResponse>;
    getAppSettings(): Promise<AppSettingsResponse>;
    enableTFA(token: string): Promise<EnableTFAResponse>;
    verifyTFA(code: string, scopes: string[], token: string): Promise<LoginResponse>;
}
