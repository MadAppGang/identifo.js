import { UrlBuilderType, IdentifoConfig } from './types/types';

export const UrlBuilder:UrlBuilderType = {
  config: {} as IdentifoConfig<string>,
  init(config) {
    this.config = { ...config, scopes: JSON.stringify(config.scopes ?? []) };

    return {
      createSignupUrl: this.createSignupUrl.bind(this),
      createSigninUrl: this.createSigninUrl.bind(this),
      createLogoutUrl: this.createLogoutUrl.bind(this),
      createRenewSessionUrl: this.createRenewSessionUrl.bind(this),
    };
  },
  getUrl(flow:string) {
    const redirectUri = this.config.redirectUri ?? window.location.href;
    const postLogoutRedirectUri = this.config.postLogoutRedirectUri ?? '';

    const baseParams = `appId=${this.config.appId}&scopes=${this.config.scopes}`;
    const urlParams = `${baseParams}&callbackUrl=${redirectUri}`;

    const urls = {
      signup: `${this.config.url}/web/register?${urlParams}`,
      signin: `${this.config.url}/web/login?${urlParams}`,
      logout: `${this.config.url}/web/logout?${baseParams}&callbackUrl=${postLogoutRedirectUri}`,
      renew: `${this.config.url}/web/token/renew?${baseParams}&redirectUri=${redirectUri}`,
      default: 'default',
    };
    return urls[flow as keyof typeof urls] || urls.default;
  },
  createSignupUrl() {
    return this.getUrl('signup');
  },

  createSigninUrl() {
    return this.getUrl('signin');
  },

  createLogoutUrl() {
    return this.getUrl('logout');
  },
  createRenewSessionUrl() {
    return this.getUrl('renew');
  },
};
