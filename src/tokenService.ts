import { INVALID_TOKEN_ERROR } from './constants';
import { LocalStorageManager } from './store-manager';
import { ClientToken, JWTPayload, TokenManager } from './types/types';

class TokenService {
  private tokenManager:TokenManager;

  constructor(tokenManager?:TokenManager) {
    this.tokenManager = tokenManager || new LocalStorageManager();
    // TODO: implement cookie as default
    // this.tokenManager = tokenManager || new CoockieStorage();
  }

  async handleVerification(token:string, audience:string, issuer:string):Promise<boolean> {
    if (!this.tokenManager.isAccessible) return true;
    try {
      await this.validateToken(token, audience, issuer);
      await this.tokenManager.saveToken(token);
      return true;
    } catch (err) {
      this.removeToken();
      return Promise.reject(err);
    }
  }

  async validateToken(token:string, audience:string, issuer:string):Promise<boolean> {
    if (!token) throw new Error(INVALID_TOKEN_ERROR);
    const jwtPayload = this.parseJWT(token);
    const isJwtExpired = this.isJWTExpired(jwtPayload);
    if (jwtPayload.aud === audience && jwtPayload.iss === issuer && !isJwtExpired) {
      return Promise.resolve(true);
    }
    throw new Error(INVALID_TOKEN_ERROR);
  }

  parseJWT(token:string):JWTPayload {
    const base64Url = token.split('.')[1];
    if (!base64Url) return { aud: '', iss: '', exp: 10 };
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('')
      .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
      .join(''));
    return JSON.parse(jsonPayload) as JWTPayload;
  }

  isJWTExpired(token:JWTPayload):boolean {
    const now = new Date().getTime() / 1000;
    if (token.exp && now > token.exp) {
      return true;
    }
    return false;
  }

  async isAuthenticated(audience:string, issuer:string):Promise<boolean> {
    if (!this.tokenManager.isAccessible) return true;
    const token = await this.tokenManager.getToken();
    // TODO: may be change to handleAuth instead validateToken
    return this.validateToken(token, audience, issuer);
  }

  async saveToken(token:string):Promise<boolean> {
    return this.tokenManager.saveToken(token);
  }

  removeToken():void {
    this.tokenManager.deleteToken();
  }

  async getToken():Promise<ClientToken | null> {
    const token = await this.tokenManager.getToken();
    if (!token) return null;
    const jwtPayload = this.parseJWT(token);
    const isJwtExpired = this.isJWTExpired(jwtPayload);
    if (!isJwtExpired) {
      return { token, payload: jwtPayload };
    }
    return null;
  }
}

export default TokenService;
