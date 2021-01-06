import IdentifoAuth from '../index';

describe('IdentifoAuth: ', () => {
  const config = {
    issuer: 'http://localhost:8081',
    appId: '59fd884d8f6b180001f5b4e2',
    scopes: [],
    redirectUri: 'http://localhost:3000',
    tokenManager: {
      jwksUrl: 'http://localhost:8081/.well-known/jwks.json',
    },
  };
  test('', () => {
    const identifo = new IdentifoAuth(config);
    expect(identifo).toBeDefined();
  });
});
