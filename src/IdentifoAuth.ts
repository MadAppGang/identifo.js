import { jwtRegex } from './constants';
import TokenService from './tokenService';
import { ClientToken, IdentifoConfig, UrlBuilderInit } from './types/types';
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
    // TODO: is auto handle needed?
    // void this.handleAuthentication();
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

  async handleAuthentication():Promise<boolean> {
    if (!window.location.href.includes(this.config.redirectUri) && !window.location.hash) {
      throw new Error();
    }
    try {
      const token = this.getTokenFromUrl();
      this.isAuthenticated = await this.tokenService.handleVerification(token, this.config.appId, this.config.issuer);
      return true;
    } catch (err) {
      this.isAuthenticated = false;
      // TODO: refactor warnings when debug mode will be implemented
      console.warn(err);
      throw err;
    } finally {
      window.location.hash = '';
    }
  }

  private getTokenFromUrl():string {
    const { hash } = window.location;
    const token = hash.slice(1);
    if (jwtRegex.test(token)) {
      return token;
    }
    return '';
  }

  async getToken():Promise<ClientToken | null> {
    const token = await this.tokenService.getToken();
    return token;
  }

  getAuthenticated():Promise<boolean> {
    // TODO: Implement auth request / correct flow
    // await api.getMe(tokenData?.token ?? '');
    return this.tokenService.isAuthenticated(this.config.appId, this.config.issuer)
      .then(() => true)
      .catch(() => false);
  }
}
export default IdentifoAuth;
