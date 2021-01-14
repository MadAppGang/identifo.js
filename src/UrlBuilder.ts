import { UrlBuilderType, IdentifoConfig } from './types/types';

export const UrlBuilder:UrlBuilderType = {
  config: {} as IdentifoConfig<string>,
  urlParams: '',

  init(config) {
    this.config = { ...config, scopes: JSON.stringify(config.scopes) };
    this.urlParams = `?appId=${this.config.appId}&scopes=${this.config.scopes}&callbackUrl=${this.config.redirectUri}`;
    return {
      createSignUpUrl: this.createSignUpUrl.bind(this),
      createSignInUrl: this.createSignInUrl.bind(this),
      createLogoutUrl: this.createLogoutUrl.bind(this),
    };
  },

  createSignUpUrl() {
    return `${this.config.issuer}/web/register${this.urlParams}`;
  },

  createSignInUrl() {
    return `${this.config.issuer}/web/login${this.urlParams}`;
  },

  createLogoutUrl() {
    return `${this.config.issuer}/web/logout${this.urlParams}`;
  },
};
