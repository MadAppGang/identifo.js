import { JWSHeaderParameters } from 'jose/webcrypto/types';

export interface TokenManager {
  isAccessible: boolean
  saveToken:(token:string) => Promise<boolean>
  getToken:() => string
  deleteToken:() => void
}

export type IdentifoConfig<S> = {
  issuer?: string, // TODO: array of string?
  appId: string,
  url: string,
  scopes?: S,
  redirectUri?: string,
  postLogoutRedirectUri?: string,
  // debugMode?: boolean,
  tokenManager?: TokenManager
};

export type UrlBuilderInit = {
  createSignupUrl: () => string,
  createSigninUrl: () => string,
  createLogoutUrl: () => string,
  createRenewSessionUrl: () => string,
};

export type UrlBuilderType = UrlBuilderInit & {
  config: IdentifoConfig<string>,
  getUrl: (flow:string) => string,
  init: (config:IdentifoConfig<string[]>) => UrlBuilderInit,
};

// TOKEN

export interface JWTPayload {
  /**
   * JWT Issuer - [RFC7519#section-4.1.1](https://tools.ietf.org/html/rfc7519#section-4.1.1).
   */
  iss?: string

  /**
   * JWT Subject - [RFC7519#section-4.1.2](https://tools.ietf.org/html/rfc7519#section-4.1.2).
   */
  sub?: string

  /**
   * JWT Audience [RFC7519#section-4.1.3](https://tools.ietf.org/html/rfc7519#section-4.1.3).
   */
  aud?: string | string[]

  /**
   * JWT ID - [RFC7519#section-4.1.7](https://tools.ietf.org/html/rfc7519#section-4.1.7).
   */
  jti?: string

  /**
   * JWT Not Before - [RFC7519#section-4.1.5](https://tools.ietf.org/html/rfc7519#section-4.1.5).
   */
  nbf?: number

  /**
   * JWT Expiration Time - [RFC7519#section-4.1.4](https://tools.ietf.org/html/rfc7519#section-4.1.4).
   */
  exp?: number

  /**
   * JWT Issued At - [RFC7519#section-4.1.6](https://tools.ietf.org/html/rfc7519#section-4.1.6).
   */
  iat?: number

  /**
   * Any other JWT Claim Set member.
   */
  [propName: string]: unknown
}

export type ClientToken = {
  token: string,
  payload: JWTPayload
  header?: JWSHeaderParameters
};
