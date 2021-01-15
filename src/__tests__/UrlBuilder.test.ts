import { UrlBuilder } from '../UrlBuilder';

describe('UrlBuilder: ', () => {
  const config = {
    issuer: 'http://localhost:8081',
    appId: '59fd884d8f6b180001f5b4e2',
    scopes: [],
    redirectUri: 'http://localhost:3000',
  };
  const urlBuilder = UrlBuilder.init(config);
  const urlParams = `?appId=${config.appId}&scopes=${JSON.stringify(config.scopes)}&callbackUrl=${config.redirectUri}`;

  test('should be defined and has methods', () => {
    expect(urlBuilder).toBeDefined();
    expect(Object.keys(urlBuilder))
      .toEqual(['createSignUpUrl', 'createSignInUrl', 'createLogoutUrl', 'createRenewSessionURL']);
  });

  test('should return correct url', () => {
    const signUpUrl = urlBuilder.createSignUpUrl();
    const signInUrl = urlBuilder.createSignInUrl();
    const logOut = urlBuilder.createLogoutUrl();
    const renewSession = urlBuilder.createRenewSessionURL();
    expect(signUpUrl).toBe(`${config.issuer}/web/register${urlParams}`);
    expect(signInUrl).toBe(`${config.issuer}/web/login${urlParams}`);
    expect(logOut).toBe(`${config.issuer}/web/logout${urlParams}`);
    expect(renewSession).toBe(
      `${config.issuer}/web/token/renew?appId=${config.appId}`
      + `&scopes=${JSON.stringify(config.scopes)}&redirectUri=${config.redirectUri}`,
    );
  });
});
