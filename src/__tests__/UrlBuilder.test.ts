import { UrlBuilder } from '../UrlBuilder';

describe('UrlBuilder:', () => {
  const config = {
    issuer: 'http://localhost:8081',
    appId: '59fd884d8f6b180001f5b4e2',
    scopes: [],
    redirectUri: 'http://localhost:3000',
  };
  test('should be defined and has methods', () => {
    const builderMethods = UrlBuilder.init(config);
    expect(builderMethods).toBeDefined();
    expect(Object.keys(builderMethods)).toEqual(['createSignUpUrl', 'createSignInUrl', 'createLogoutUrl']);
  });
});
