import { api } from './api/api';
import { jwtRegex } from './constants';
import Iframe from './iframe';
import TokenService from './tokenService';
import { ClientToken, IdentifoConfig, UrlBuilderInit } from './types/types';
import { UrlBuilder } from './UrlBuilder';

class IdentifoAuth {
  private config: IdentifoConfig<string[]>;

  private urlBuilder: UrlBuilderInit;

  private tokenService: TokenService;

  private token: ClientToken | null = null;

  private renewSessionId: number | undefined;

  isAuth = false;

  constructor(config: IdentifoConfig<string[]>) {
    this.config = { ...config, autoRenew: config.autoRenew ?? true };
    this.tokenService = new TokenService(config.tokenManager);
    this.urlBuilder = UrlBuilder.init(this.config);
  }

  init(): void {
    const token = this.tokenService.getToken();
    if (token) {
      const isExpired = this.tokenService.isJWTExpired(token.payload);
      if (isExpired) {
        this.renewSession()
          .then((t) => this.handleToken(t))
          .catch(() => this.resetAuthValues());
      } else {
        this.handleToken(token.token);
      }
    }
  }

  private handleToken(token: string) {
    const payload = this.tokenService.parseJWT(token);
    this.token = { token, payload };
    this.isAuth = true;
    this.tokenService.saveToken(token);
    if (this.renewSessionId) {
      window.clearTimeout(this.renewSessionId);
    }
    if (payload.exp) {
      this.renewSessionId = window.setTimeout(() => {
        if (this.config.autoRenew) {
          this.renewSession()
            .then((t) => this.handleToken(t))
            .catch(() => this.resetAuthValues());
        } else {
          this.resetAuthValues();
        }
      }, payload.exp - (new Date().getTime() / 1000) - 60000);
    }
  }

  private resetAuthValues() {
    this.token = null;
    this.isAuth = false;
    this.tokenService.removeToken();
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
      return Promise.reject();
    }
    try {
      await this.tokenService.handleVerification(token, this.config.appId, this.config.issuer);
      this.handleToken(token);
      return Promise.resolve(true);
    } catch (err) {
      return Promise.reject();
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

  getToken(): ClientToken {
    if (this.token) {
      return this.token;
    }
    return { token: '', payload: {} };
  }

  async renewSession(): Promise<string> {
    try {
      const token = await this.renewSessionWithIframe();
      this.handleToken(token);
      return Promise.resolve(token);
    } catch (err) {
      return Promise.reject();
    }
  }

  private async renewSessionWithToken(): Promise<string> {
    try {
      const r = await api.renewToken(this.urlBuilder.createRenewSessionUrl());
      return r;
    } catch (err) {
      return Promise.resolve('');
    }
  }

  private async renewSessionWithIframe(): Promise<string> {
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
