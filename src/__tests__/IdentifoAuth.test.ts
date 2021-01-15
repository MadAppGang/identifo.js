import IdentifoAuth from '../IdentifoAuth';

describe('IdentifoAuth: ', () => {
  const config = {
    issuer: 'http://localhost:8081',
    appId: '59fd884d8f6b180001f5b4e2',
    scopes: [],
    redirectUri: 'http://localhost:3000',
  };

  const identifo = new IdentifoAuth(config);

  test('should be defined', () => {
    expect(identifo).toBeDefined();
  });

  test('should return auth status', () => {
    const authStatus = identifo.getAuthenticated();
    expect(typeof authStatus === 'boolean').toBeTruthy();
  });

  test('should be rejected', () => expect(identifo.handleAuthentication()).rejects.toBeInstanceOf(Error));
});
