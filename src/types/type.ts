import { JWTPayload } from 'jose/webcrypto/types';

export type ClientToken = {
  token: string | undefined,
  payload: JWTPayload
};

export type TokenManager = {
  storage?: 'localStorage' | 'sessionStorage',
  jwksUrl: string,
  // jwk?: JWK
};

export type IdentifoConfig<S> = {
  issuer: string,
  appId: string,
  scopes: S,
  redirectUri: string,
  tokenManager: TokenManager
};

export type UrlBuilderInit = {
  createSignUpUrl: () => string,
  createSignInUrl: () => string,
  createLogoutUrl: () => string,
};

export type UrlBuilderType = UrlBuilderInit & {
  config: IdentifoConfig<string> | null,
  init: (config:IdentifoConfig<string[]>) => UrlBuilderInit,
};
