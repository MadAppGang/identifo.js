import { jwtRegex } from './constants';
import Iframe from './iframe';
import TokenService from './tokenService';
import { ClientToken, IdentifoConfig, UrlBuilderInit } from './types/types';
import { UrlBuilder } from './UrlBuilder';

class IdentifoAuth {
  private config;

  private urlBuilder: UrlBuilderInit;

  private tokenService:TokenService;

  // private isAuthenticated = false;

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
      await this.tokenService.handleVerification(token, this.config.appId, this.config.issuer);
      return true;
    } catch (err) {
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

  async getAuthenticated():Promise<boolean> {
    // TODO: Implement auth request / correct flow
    // await api.getMe(tokenData?.token ?? '');
    try {
      await this.tokenService.isAuthenticated(this.config.appId, this.config.issuer);
      return true;
    } catch (e) {
      return false;
    }
  }

  async renewSession():Promise<string> {
    const iframe = Iframe.create();
    const timeout = setTimeout(() => {
      Iframe.remove(iframe);
      throw new Error('Timeout expired');
    }, 30000);

    try {
      const token = await Iframe.captureMessage(iframe, this.urlBuilder.createRenewSessionURL());
      await this.tokenService.handleVerification(token, this.config.appId, this.config.issuer);
      return token;
    } catch (err) {
      throw new Error(err);
    } finally {
      clearTimeout(timeout);
      Iframe.remove(iframe);
    }
  }
}
export default IdentifoAuth;
