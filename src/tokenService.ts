import { JWTPayload, ClientToken, TokenManager } from './types/types';
import { ACCESS_TOKEN_KEY, jwtRegex } from './constants';

class TokenService {
  private tokenManager:TokenManager;

  private defaultTokenManager:TokenManager = {
    storage: 'localStorage',
  };

  constructor(tokenManager:TokenManager | undefined) {
    this.tokenManager = tokenManager || this.defaultTokenManager;
  }

  get tokenFromStorage():string {
    return window[this.tokenManager.storage].getItem(ACCESS_TOKEN_KEY) ?? '';
  }

  handleVerification(audience:string, issuer:string):Promise<void> {
    return new Promise((res, rej) => {
      const token = this.getTokenFromUrl();
      const jwtPayload = this.parseJWT(token);
      const { aud, iss } = jwtPayload;
      const isJwtExpired = this.isJWTExpired(jwtPayload);
      if (aud === audience && iss === issuer && !isJwtExpired) {
        this.saveToken(token);
        res();
      } else {
        // TODO: need to delete token from store if isnt valid?
        rej(new Error('Token is invalid'));
      }
    });
  }

  private getTokenFromUrl():string {
    const { hash } = window.location;
    const token = hash.slice(1);
    if (jwtRegex.test(token)) {
      return token;
    }
    return '';
  }

  parseJWT(token:string):JWTPayload {
    const base64Url = token.split('.')[1];
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

  saveToken(token:string):void {
    window[this.tokenManager.storage].setItem(ACCESS_TOKEN_KEY, token);
  }

  getToken():ClientToken | null {
    if (this.tokenFromStorage) {
      const jwtPayload = this.parseJWT(this.tokenFromStorage);
      const isJwtExpired = this.isJWTExpired(jwtPayload);
      if (!isJwtExpired) {
        return { token: this.tokenFromStorage, payload: jwtPayload };
      }
      return null;
    }
    return null;
  }
}

export default TokenService;
