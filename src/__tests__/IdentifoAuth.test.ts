import IdentifoAuth from '../index';

describe('IdentifoAuth: ', () => {
  const config = {
    issuer: 'http://localhost:8081',
    appId: '59fd884d8f6b180001f5b4e2',
    scopes: [],
    redirectUri: 'http://localhost:3000',
    tokenManager: {
      verificationKey: {
        alg: 'ES256',
        kty: 'EC',
        use: 'sig',
        kid: 'puW5XcC2JAoBrGn0HjLCMkkYl2I',
        crv: 'P-256',
        x: 'D3DoOWZMbqYc0OO1Ih628hB2Odhv4mjl1vt0iBu3gTI',
        y: 's9VwJPmBxvGqCPuNkyZXuoWsJk860g-pIWjUWg0ACm4',
      },
    },
  };
  test('', () => {
    const identifo = new IdentifoAuth(config);
    expect(identifo).toBeDefined();
  });
});
