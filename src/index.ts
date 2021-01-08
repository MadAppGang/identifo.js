import TokenService from './tokenService';
import {
  ClientToken, IdentifoConfig, TokenManager, UrlBuilderInit,
} from './types/type';
import { UrlBuilder } from './UrlBuilder';

class IdentifoAuth {
  private issuer: string;

  private appId: string;

  private scopes: string[];

  private redirectUri: string;

  private tokenManager: TokenManager;

  private urlBuilder: UrlBuilderInit;

  private tokenService:TokenService;

  isAuthenticated = false;

  constructor(config:IdentifoConfig<string[]>) {
    this.issuer = config.issuer;
    this.appId = config.appId;
    this.scopes = config.scopes;
    this.redirectUri = config.redirectUri;
    this.tokenManager = config.tokenManager;
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
    // TODO: Remove comment after PR check
    // if (window.location.href.includes(this.redirectUri) && window.location.hash) {
    this.tokenService.verify(this.appId, this.issuer)
      .then((token) => console.log(token))
      .catch(() => {});
  }

  async getToken():Promise<ClientToken> {
    try {
      await this.tokenService.verify(this.appId, this.issuer);
      return this.tokenService.getToken();
    } catch (err) {
      throw new Error(err);
    }
  }
}
export default IdentifoAuth;
