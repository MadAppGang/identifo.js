import { getCompanyName } from '../index';

describe('getCompanyName:', () => {
  test('should return madappgang', () => {
    expect(getCompanyName('madappgang')).toBe('madappgang');
  });
});
