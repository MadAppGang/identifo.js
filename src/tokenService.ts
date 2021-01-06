import parseJwk from 'jose/jwk/parse';
import jwtVerify from 'jose/jwt/verify';
import { JWK, JWTVerifyResult } from 'jose/webcrypto/types';
import { api } from './api';
import { ACCESS_TOKEN_KEY, jwtPattern } from './constants';
import { ClientToken, TokenManager } from './types/type';

class TokenService {
  private config:TokenManager | undefined;

  private parsedToken = {} as JWTVerifyResult;

  token: string;

  constructor(tokenManager:TokenManager) {
    this.token = this.parseFromUrl(window.location.hash) || this.tokenFromStorage;
    this.config = tokenManager;
  }

  // eslint-disable-next-line class-methods-use-this
  private parseFromUrl(hash:string):string {
    const token = hash.slice(1);
    if (jwtPattern.test(token)) return token;
    return '';
  }

  async verify(audience:string, issuer:string, jwksUrl:string):Promise<string> {
    try {
      // TODO: Implement get method for local jwks
      const key = await this.getJwks(jwksUrl);
      const publicKey = await parseJwk(key);
      const parsedToken = await jwtVerify(this.token, publicKey, { audience, issuer });
      this.parsedToken = parsedToken;
      // TODO: refactor working with token
      // (uri token and token, getter for this + verify need to be for token from store and uri)
      this.saveToken();
      return this.token;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Invalid Token');
      throw new Error('Invalid Token');
    }
  }

  // TODO: Fix warn with [storage]
  get tokenFromStorage():string {
    return window[this.config?.storage ?? 'localStorage'].getItem(ACCESS_TOKEN_KEY) || '';
  }

  // eslint-disable-next-line class-methods-use-this
  private async getJwks(url:string):Promise<JWK> {
    const keys = await api.getJwks(url);
    return keys[0];
  }

  private saveToken():void {
    if (this.token) window[this.config?.storage ?? 'localStorage'].setItem(ACCESS_TOKEN_KEY, this.token);
  }

  getToken():ClientToken {
    return { token: this.token, payload: this.parsedToken.payload };
  }
}

export default TokenService;
