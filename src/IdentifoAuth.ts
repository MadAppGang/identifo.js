import { jwtRegex } from './constants';
import Iframe from './iframe';
import TokenService from './tokenService';
import { ClientToken, IdentifoConfig, UrlBuilderInit } from './types/types';
import { UrlBuilder } from './UrlBuilder';

class IdentifoAuth {
  private config: IdentifoConfig<string[]>;

  private urlBuilder: UrlBuilderInit;

  private tokenService: TokenService;

  constructor(config: IdentifoConfig<string[]>) {
    this.config = config;
    this.tokenService = new TokenService(config.tokenManager);
    this.urlBuilder = UrlBuilder.init(this.config);
    // TODO: is auto handle needed?
    // void this.handleAuthentication();
  }

  signup(): void {
    window.location.href = this.urlBuilder.createSignupUrl();
  }

  signin(): void {
    window.location.href = this.urlBuilder.createSigninUrl();
  }

  logout(): void {
    this.tokenService.removeToken();
    window.location.href = this.urlBuilder.createLogoutUrl();
  }

  async handleAuthentication(): Promise<boolean> {
    const token = this.getTokenFromUrl();
    if (!token) {
      return false;
    }
    try {
      await this.tokenService.handleVerification(token, this.config.appId, this.config.issuer);
      return true;
    } catch (err) {
      return false;
    } finally {
      window.location.hash = '';
    }
  }

  private getTokenFromUrl(): string {
    const { hash } = window.location;
    const token = hash.slice(1);
    if (jwtRegex.test(token)) {
      return token;
    }
    return '';
  }

  getToken(): ClientToken | null {
    const token = this.tokenService.getToken();
    return token;
  }

  async getAuthenticated(): Promise<boolean> {
    // TODO: Implement auth request / correct flow
    // await api.getMe(tokenData?.token ?? '');
    try {
      await this.tokenService.isAuthenticated(this.config.appId, this.config.issuer);
      return true;
    } catch (e) {
      return false;
    }
  }

  async renewSession(): Promise<string> {
    const iframe = Iframe.create();
    const timeout = setTimeout(() => {
      Iframe.remove(iframe);
      throw new Error('Timeout expired');
    }, 30000);

    try {
      const token = await Iframe.captureMessage(iframe, this.urlBuilder.createRenewSessionUrl());
      await this.tokenService.handleVerification(token, this.config.appId, this.config.issuer);
      return token;
    } catch (err) {
      return Promise.reject(err);
    } finally {
      clearTimeout(timeout);
      Iframe.remove(iframe);
    }
  }
}
export default IdentifoAuth;
