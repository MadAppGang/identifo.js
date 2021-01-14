/* eslint-disable @typescript-eslint/require-await */
import { TokenManager } from '../types/types';

class SessionStorage implements TokenManager {
  key = 'identifo_access_token';

  isAccessible = true;

  constructor(key?:string) {
    this.key = key || this.key;
  }

  async saveToken(token:string):Promise<boolean> {
    if (token) {
      window.sessionStorage.setItem(this.key, token);
      return true;
    }
    return false;
  }

  async getToken():Promise<string> {
    return window.sessionStorage.getItem(this.key) ?? '';
  }
}

export default SessionStorage;
