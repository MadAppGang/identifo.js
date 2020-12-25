export type IdentifoConfig<S> = {
  issuer: string,
  appId: string,
  scopes: S,
  redirectUri: string,
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
