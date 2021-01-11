import { JWTPayload } from 'jose/webcrypto/types';
import TokenService from './tokenService';
import {
  ClientToken, IdentifoConfig, UrlBuilderInit,
} from './types/type';
import { UrlBuilder } from './UrlBuilder';

class IdentifoAuth {
  private config;

  private urlBuilder: UrlBuilderInit;

  private tokenService:TokenService;

  isAuthenticated = false;

  constructor(config:IdentifoConfig<string[]>) {
    this.config = config;
    this.tokenService = new TokenService(config.tokenManager);
    this.urlBuilder = UrlBuilder.init(config);
    this.handleAuthentication();
  }

  signUp():void {
    window.location.href = this.urlBuilder.createSignUpUrl();
  }

  signIn():void {
    window.location.href = this.urlBuilder.createSignInUrl();
  }

  logOut():void {
    window.location.href = this.urlBuilder.createLogoutUrl();
  }

  private handleAuthentication():void {
    if (window.location.href.includes(this.config.redirectUri) && window.location.hash) {
      this.tokenService.handleVerify(this.config.appId, this.config.issuer)
        .then(() => this.isAuthenticated = true)
        .catch((err) => {
          if (err instanceof Error) {
            console.warn(err.message);
          }
          this.isAuthenticated = false;
        });
    }
  }

  isJWTExpired(token:JWTPayload):boolean {
    const now = new Date().getTime() / 1000;
    if (token.exp && now > token.exp) {
      return true;
    }
    return false;
  }

  getToken():ClientToken | null {
    return this.tokenService.getToken();
  }

  getIsAuth():boolean {
    const tokenData = this.tokenService.getToken();
    if (!tokenData?.token) {
      this.isAuthenticated = false;
      return this.isAuthenticated;
    }
    const parsedToken = this.tokenService.parseJWT(tokenData?.token);
    this.isAuthenticated = !this.isJWTExpired(parsedToken);
    return this.isAuthenticated;
  }
}
export default IdentifoAuth;
