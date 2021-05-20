import { ClientToken, JWTPayload, TokenManager } from './types/types';
declare class TokenService {
    private tokenManager;
    constructor(tokenManager?: TokenManager);
    handleVerification(token: string, audience: string, issuer?: string): Promise<boolean>;
    validateToken(token: string, audience: string, issuer?: string): Promise<boolean>;
    parseJWT(token: string): JWTPayload;
    isJWTExpired(token: JWTPayload): boolean;
    isAuthenticated(audience: string, issuer?: string): Promise<boolean>;
    saveToken(token: string): boolean;
    removeToken(): void;
    getToken(): ClientToken | null;
}
export default TokenService;
