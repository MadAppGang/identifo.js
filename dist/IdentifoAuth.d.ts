import { Api } from './api/api';
import { ClientToken, IdentifoConfig } from './types/types';
declare class IdentifoAuth {
    api: Api;
    private config;
    private urlBuilder;
    private tokenService;
    private token;
    private refreshToken;
    private renewSessionId;
    isAuth: boolean;
    constructor(config: IdentifoConfig);
    init(): void;
    private handleToken;
    private resetAuthValues;
    signup(): void;
    signin(): void;
    logout(): void;
    handleAuthentication(): Promise<boolean>;
    private getTokenFromUrl;
    getToken(): ClientToken;
    renewSession(): Promise<string>;
    private renewSessionWithToken;
    private renewSessionWithIframe;
}
export default IdentifoAuth;
