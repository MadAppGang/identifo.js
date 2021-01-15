/* eslint-disable @typescript-eslint/require-await */
import { TokenManager } from '../types/types';

class LocalStorage implements TokenManager {
  key = 'identifo_access_token';

  isAccessible = true;

  constructor(key?:string) {
    this.key = key || this.key;
  }

  async saveToken(token:string):Promise<boolean> {
    if (token) {
      window.localStorage.setItem(this.key, token);
      return true;
    }
    return false;
  }

  async getToken():Promise<string> {
    return window.localStorage.getItem(this.key) ?? '';
  }

  async deleteToken():Promise<void> {
    window.localStorage.removeItem(this.key);
  }
}

export default LocalStorage;
