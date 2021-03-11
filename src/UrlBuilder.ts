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
    const callbackUrl = this.config.callbackUrl ?? window.location.href;
    const returnTo = this.config.returnTo ?? '';

    const baseParams = `appId=${this.config.appId}&scopes=${this.config.scopes}`;
    const urlParams = `${baseParams}&callbackUrl=${callbackUrl}`;

    const urls = {
      signup: `${this.config.authUrl}/web/register?${urlParams}`,
      signin: `${this.config.authUrl}/web/login?${urlParams}`,
      logout: `${this.config.authUrl}/web/logout?${baseParams}&callbackUrl=${returnTo}`,
      renew: `${this.config.authUrl}/web/token/renew?${baseParams}&redirectUri=${callbackUrl}`,
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
