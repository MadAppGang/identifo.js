import { UrlBuilderType } from './types/type';

export const UrlBuilder:UrlBuilderType = {
  config: null,

  init(config) {
    this.config = { ...config, scopes: JSON.stringify(config.scopes) };
    return {
      createSignUpUrl: this.createSignUpUrl.bind(this),
      createSignInUrl: this.createSignInUrl.bind(this),
      createLogoutUrl: this.createLogoutUrl.bind(this),
    };
  },
  createSignUpUrl() {
    return `${this.config?.issuer}/web/register`
      + `?appId=${this.config?.appId}&scopes=${this.config?.scopes}&callbackUrl=${this.config?.redirectUri}`;
  },

  createSignInUrl() {
    return `${this.config?.issuer}/web/login`
      + `?appId=${this.config?.appId}&scopes=${this.config?.scopes}&callbackUrl=${this.config?.redirectUri}/callback`;
  },

  createLogoutUrl() {
    return `${this.config?.issuer}/web/logout`
      + `?appId=${this.config?.appId}&scopes=${this.config?.scopes}&callbackUrl=${this.config?.redirectUri}`;
  },
};
