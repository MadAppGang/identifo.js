import { INVALID_TOKEN_ERROR } from '../src/constants';
import TokenService from '../src/tokenService';

const jwt = require('jwt-simple');

describe('Token Service: ', () => {
  const tokenService = new TokenService();
  const audience = '59fd884d8f6b180001f5b4e2';
  const issuer = 'http://localhost:8081';
  const payload = {
    type: 'access',
    aud: audience,
    iss: issuer,
    exp: new Date().getTime() / 1000 + 3600,
  };
  const token = jwt.encode(payload, 'secret');

  describe('handleVerification: ', () => {
    test('Should return be truthy', async () => {
      expect(await tokenService.handleVerification(token, audience, issuer)).toBeTruthy();
    });
    test('Should return throw Error with inccorect token', () => {
      expect(tokenService.handleVerification('token', audience, issuer)).rejects.toStrictEqual(new Error(INVALID_TOKEN_ERROR));
    });
  });

  describe('validateToken: ', () => {
    test('Should return be truthy', async () => {
      expect(await tokenService.validateToken(token, audience, issuer)).toBeTruthy();
    });
    test('Should return throw Error with inccorect token', () => {
      expect(tokenService.validateToken('token', audience, issuer)).rejects.toStrictEqual(new Error(INVALID_TOKEN_ERROR));
      expect(tokenService.validateToken('', audience, issuer)).rejects.toStrictEqual(new Error(INVALID_TOKEN_ERROR));
    });
  });

  describe('parseJWT: ', () => {
    test('Should parse jwt token', () => {
      const parsedToken = tokenService.parseJWT(token);
      expect(Object.keys(parsedToken)).toEqual(['type', 'aud', 'iss', 'exp']);
      expect(parsedToken.aud).toBe(audience);
      expect(parsedToken.iss).toBe(issuer);
      expect(parsedToken.exp).toBe(payload.exp);
      expect(parsedToken.type).toBe(payload.type);
    });
    test('Should return inccorect paylaod', () => {
      const parsedToken = tokenService.parseJWT('');
      expect(parsedToken.aud).toBe('');
      expect(parsedToken.iss).toBe('');
    });
  });

  describe('isJWTExpired: ', () => {
    test('Should return expired status', () => {
      const correctToken = tokenService.parseJWT(token);
      const incorrectToken = tokenService.parseJWT('token');
      let isExpired = tokenService.isJWTExpired(correctToken);
      expect(isExpired).toBe(false);
      isExpired = tokenService.isJWTExpired(incorrectToken);
      expect(isExpired).toBe(true);
    });
  });

  describe('isAuthenticated: ', () => {
    test('Should return isAuthenticated status', async () => {
      expect(tokenService.isAuthenticated(audience, issuer)).rejects.toStrictEqual(new Error(INVALID_TOKEN_ERROR));
      await tokenService.saveToken(token);
      expect(tokenService.isAuthenticated(audience, issuer)).resolves.toBeTruthy();
    });
  });

  describe('saveToken: ', () => {
    test('Should resolve with save status', () => {
      expect(tokenService.saveToken(token)).resolves.toBe(true);
      expect(tokenService.saveToken('')).resolves.toBe(false);
    });
  });

  describe('getToken: ', () => {
    test('Should return token from storage', async () => {
      await tokenService.saveToken(token);
      let retrievedToken = await tokenService.getToken();
      expect(Object.keys(retrievedToken)).toEqual(['token', 'payload']);
      expect(retrievedToken.token).toBe(token);
      await tokenService.saveToken('token');
      retrievedToken = await tokenService.getToken();
      expect(retrievedToken).toBe(null);
    });
  });
});
