import { UrlBuilder } from '../src/UrlBuilder';

describe('UrlBuilder: ', () => {
  const config = {
    authUrl: 'http://localhost:8081',
    appId: '59fd884d8f6b180001f5b4e2',
    scopes: [],
    returnTo: 'http://localhost:8081/returnTo',
    callbackUrl: 'http://localhost:8081/callbackUrl',
  };
  const urlBuilder = UrlBuilder.init(config);
  test('should be defined and has methods', () => {
    expect(urlBuilder).toBeDefined();
    expect(Object.keys(urlBuilder))
      .toEqual(['createSignupUrl', 'createSigninUrl', 'createLogoutUrl', 'createRenewSessionUrl']);
  });

  test('should return correct url (all params is defined)', () => {
    const baseParams = `appId=${config.appId}&scopes=${JSON.stringify(config.scopes)}`;
    const baseSuffixParam = `${baseParams}&callbackUrl=${config.callbackUrl}`;

    expect(urlBuilder.createSignupUrl()).toBe(`${config.authUrl}/web/register?${baseSuffixParam}`);
    expect(urlBuilder.createSigninUrl()).toBe(`${config.authUrl}/web/login?${baseSuffixParam}`);
    expect(urlBuilder.createLogoutUrl()).toBe(`${config.authUrl}/web/logout?${baseParams}&callbackUrl=${config.returnTo}`);
    expect(urlBuilder.createRenewSessionUrl())
      .toBe(`${config.authUrl}/web/token/renew?${baseParams}&redirectUri=${config.callbackUrl}`);
  });

  test('should return correct url (only app id & authUrl are defined)', () => {
    const urlConfig = {
      authUrl: 'http://localhost:8081',
      appId: '59fd884d8f6b180001f5b4e2',
    };
    const urls = UrlBuilder.init(urlConfig);
    const baseParams = `appId=${urlConfig.appId}&scopes=${JSON.stringify([])}`;
    const baseSuffixParam = `${baseParams}&callbackUrl=${window.location.href}`;

    expect(urls.createSignupUrl()).toBe(`${urlConfig.authUrl}/web/register?${baseSuffixParam}`);
    expect(urls.createSigninUrl()).toBe(`${urlConfig.authUrl}/web/login?${baseSuffixParam}`);
    expect(urls.createLogoutUrl())
      .toBe(`${urlConfig.authUrl}/web/logout?${baseParams}&callbackUrl=`);
    expect(urls.createRenewSessionUrl())
      .toBe(`${urlConfig.authUrl}/web/token/renew?${baseParams}&redirectUri=${window.location.href}`);
  });
});
