import parseJwk from 'jose/jwk/parse';
import jwtVerify from 'jose/jwt/verify';
import {
  JWK, JWTPayload, JWTVerifyResult, KeyLike,
} from 'jose/webcrypto/types';
import { api } from './api';
import { ACCESS_TOKEN_KEY, jwtPattern } from './constants';
import { ClientToken, TokenManager } from './types/type';

class TokenService {
  private tokenManager:TokenManager;

  private parsedToken = {} as JWTVerifyResult;

  constructor(tokenManager:TokenManager) {
    this.tokenManager = tokenManager;
  }

  get tokenFromStorage():string {
    return window[this.tokenManager.storage || 'localStorage'].getItem(ACCESS_TOKEN_KEY) ?? '';
  }

  private getTokenFromUrl():string {
    const { hash } = window.location;
    const token = hash.slice(1);
    if (jwtPattern.test(token)) {
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

  async handleVerify(audience:string, issuer:string):Promise<string> {
    try {
      const token = this.getTokenFromUrl() || this.tokenFromStorage;
      const key = await this.getJWK();
      await this.verify(token, key, audience, issuer);
      this.saveToken(token);
      return token;
    } catch (err) {
      throw new Error(err);
    }
  }

  async verify(token:string, key:KeyLike, audience:string, issuer:string):Promise<string> {
    try {
      const parsedToken = await jwtVerify(token, key, { audience, issuer });
      this.parsedToken = parsedToken;
      return token;
    } catch (err) {
      throw new Error('Invalid Token');
    }
  }

  async getJWK():Promise<KeyLike> {
    let key = {};
    // TODO: change 'string' to URL type
    try {
      if (typeof this.tokenManager.verificationKey === 'string') {
        key = await this.getJWKS(this.tokenManager.verificationKey);
      }
      if (this.isJWK(this.tokenManager.verificationKey as JWK)) {
        key = this.tokenManager.verificationKey;
      }
      return await parseJwk(key);
    } catch (err) {
      throw new Error('Invalid verification key');
    }
  }

  private isJWK(jwk: JWK): jwk is JWK {
    return jwk.alg !== undefined;
  }

  private async getJWKS(url:string):Promise<JWK> {
    try {
      const keys = await api.getJWKS(url);
      return keys[0];
    } catch (err) {
      throw new Error('Invalid verification key');
    }
  }

  saveToken(token:string):void {
    window[this.tokenManager.storage || 'localStorage'].setItem(ACCESS_TOKEN_KEY, token);
  }

  getToken():ClientToken | null {
    if (this.tokenFromStorage) {
      const payload = this.parseJWT(this.tokenFromStorage);
      return { token: this.tokenFromStorage, payload };
    }
    return null;
  }
}

export default TokenService;
