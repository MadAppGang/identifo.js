import { Api } from './api/api';
import { jwtRegex, REFRESH_TOKEN_QUERY_KEY, TOKEN_QUERY_KEY } from './constants';
import Iframe from './iframe';
import TokenService from './tokenService';
import { ClientToken, IdentifoConfig, UrlBuilderInit } from './types/types';
import { UrlBuilder } from './UrlBuilder';

class IdentifoAuth {
  public api: Api;

  public tokenService: TokenService;

  public config: IdentifoConfig;

  public urlBuilder: UrlBuilderInit;

  private token: ClientToken | null = null;

  private refreshToken: string | null = null;

  private renewSessionId: number | undefined;

  isAuth = false;

  constructor(config: IdentifoConfig) {
    this.config = { ...config, autoRenew: config.autoRenew ?? true };
    this.tokenService = new TokenService(config.tokenManager);
    this.urlBuilder = new UrlBuilder(this.config);
    this.api = new Api(config, this.tokenService);
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
      }, (payload.exp - new Date().getTime() / 1000 - 60000) * 1000);
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
    this.tokenService.removeToken('access');
    window.location.href = this.urlBuilder.createLogoutUrl();
  }

  async handleAuthentication(): Promise<boolean> {
    const { access } = this.getTokenFromUrl();
    if (!access) {
      return Promise.reject();
    }
    try {
      await this.tokenService.handleVerification(access, this.config.appId, this.config.issuer);
      this.handleToken(access);
      return await Promise.resolve(true);
    } catch (err) {
      return await Promise.reject();
    } finally {
      // TODO: Nikita K cahnge correct window key
      window.location.hash = '';
    }
  }

  private getTokenFromUrl(): { access: string; refresh: string } {
    const urlParams = new URLSearchParams(window.location.search);
    const tokens = { access: '', refresh: '' };
    const accessToken = urlParams.get(TOKEN_QUERY_KEY);
    const refreshToken = urlParams.get(REFRESH_TOKEN_QUERY_KEY);

    if (refreshToken && jwtRegex.test(refreshToken)) {
      tokens.refresh = refreshToken;
    }
    if (accessToken && jwtRegex.test(accessToken)) {
      tokens.access = accessToken;
    }

    return tokens;
  }

  getToken(): ClientToken {
    const token = this.tokenService.getToken();
    if (token) {
      return token;
    }

    return { token: '', payload: {} };
  }

  async renewSession(): Promise<string> {
    try {
      const token = await this.renewSessionWithIframe();
      this.handleToken(token);
      return await Promise.resolve(token);
    } catch (err) {
      return Promise.reject();
    }
  }

  private async renewSessionWithToken(): Promise<string> {
    try {
      const r = await this.api.renewToken().then((l) => l.access_token || '');
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
