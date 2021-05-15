import { UrlBuilderType, IdentifoConfig, UrlFlows } from './types/types';

export const UrlBuilder: UrlBuilderType = {
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
  getUrl(flow: UrlFlows) {
    const redirectUri = encodeURIComponent(this.config.redirectUri ?? window.location.href);
    const baseParams = `appId=${this.config.appId}&scopes=${this.config.scopes}`;
    const urlParams = `${baseParams}&callbackUrl=${redirectUri}`;
    // if postLogoutRedirectUri is empty, login url will be instead
    const postLogoutRedirectUri = this.config.postLogoutRedirectUri
      ? `&callbackUrl=${encodeURIComponent(this.config.postLogoutRedirectUri)}`
      : `&callbackUrl=${redirectUri}&redirectUri=${this.config.url}/web/login?${baseParams}`;

    const urls = {
      signup: `${this.config.url}/web/register?${urlParams}`,
      signin: `${this.config.url}/web/login?${urlParams}`,
      logout: `${this.config.url}/web/logout?${baseParams}${postLogoutRedirectUri}`,
      renew: `${this.config.url}/web/token/renew?${baseParams}&redirectUri=${redirectUri}`,
      default: 'default',
    };

    return urls[flow] || urls.default;
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
