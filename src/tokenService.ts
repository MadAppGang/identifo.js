import parseJwk from 'jose/jwk/parse';
import jwtVerify from 'jose/jwt/verify';
import { JWK, JWTVerifyResult } from 'jose/webcrypto/types';
import { api } from './api';
import { ACCESS_TOKEN_KEY, jwtPattern } from './constants';
import { ClientToken, TokenManager } from './types/type';

class TokenService {
  private tokenManager:TokenManager;

  private parsedToken = {} as JWTVerifyResult;

  token: string;

  constructor(tokenManager:TokenManager) {
    this.tokenManager = tokenManager;
    this.token = this.parseFromUrl(window.location.hash) || this.tokenFromStorage;
  }

  // eslint-disable-next-line class-methods-use-this
  private parseFromUrl(hash:string):string {
    const token = hash.slice(1);
    if (jwtPattern.test(token)) {
      return token;
    }
    return '';
  }

  async verify(audience:string, issuer:string):Promise<string> {
    try {
      const key = await this.getJWK();
      const publicKey = await parseJwk(key);
      const parsedToken = await jwtVerify(this.token, publicKey, { audience, issuer });
      this.parsedToken = parsedToken;
      this.saveToken();
      return this.token;
    } catch (err) {
      throw new Error('Invalid Token');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private isJWK(jwk: JWK): jwk is JWK {
    return jwk.alg !== undefined;
  }

  private getJWK():JWK | Promise<JWK> {
    // TODO: change 'string' to URL type
    if (typeof this.tokenManager.verificationKey === 'string') {
      return this.getJWKS(this.tokenManager.verificationKey);
    }
    if (this.isJWK(this.tokenManager.verificationKey)) {
      return this.tokenManager.verificationKey;
    }
    return Promise.reject();
  }

  get tokenFromStorage():string {
    return window[this.tokenManager.storage || 'localStorage'].getItem(ACCESS_TOKEN_KEY) || '';
  }

  // eslint-disable-next-line class-methods-use-this
  private async getJWKS(url:string):Promise<JWK> {
    try {
      const keys = await api.getJWKS(url);
      return keys[0];
    } catch (err) {
      throw new Error('Invalid verification key');
    }
  }

  private saveToken():void {
    if (this.token) window[this.tokenManager.storage || 'localStorage'].setItem(ACCESS_TOKEN_KEY, this.token);
  }

  getToken():ClientToken {
    return { token: this.token, payload: this.parsedToken.payload };
  }
}

export default TokenService;
