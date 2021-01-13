import TokenService from './tokenService';
import {
  ClientToken, IdentifoConfig, UrlBuilderInit,
} from './types/types';
import { UrlBuilder } from './UrlBuilder';

class IdentifoAuth {
  private config;

  private urlBuilder: UrlBuilderInit;

  private tokenService:TokenService;

  private isAuthenticated = false;

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
      this.tokenService.handleVerification(this.config.appId, this.config.issuer)
        .then(() => this.isAuthenticated = true)
        .catch((err) => {
          // TODO: refactor warnings when debug mode will be implemented
          if (err instanceof Error) {
            console.warn(err.message);
          }
          this.isAuthenticated = false;
        });
      // window.location.hash = '';
    }
  }

  private handleAuthStatus():boolean {
    const tokenData = this.tokenService.getToken();
    if (!tokenData?.token) {
      this.isAuthenticated = false;
      return this.isAuthenticated;
    }
    const jwtPayload = this.tokenService.parseJWT(tokenData?.token);
    this.isAuthenticated = !this.tokenService.isJWTExpired(jwtPayload);
    return this.isAuthenticated;
  }

  getToken():ClientToken | null {
    return this.tokenService.getToken();
  }

  getAuthenticated():boolean {
    const isAuthenticated = this.handleAuthStatus();
    return isAuthenticated;
  }
}
export default IdentifoAuth;
