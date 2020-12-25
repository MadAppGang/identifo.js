import { IdentifoConfig, UrlBuilderInit } from './types/type';
import { UrlBuilder } from './UrlBuilder';

class IdentifoAuth {
  private issuer: string;

  private appId: string;

  private scopes: string[];

  private redirectUri: string;

  private urlBuilder: UrlBuilderInit;

  constructor(config:IdentifoConfig<string[]>) {
    this.issuer = config.issuer;
    this.appId = config.appId;
    this.scopes = config.scopes;
    this.redirectUri = config.redirectUri;
    this.urlBuilder = UrlBuilder.init(config);
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
}

export default IdentifoAuth;
