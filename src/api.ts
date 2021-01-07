import axios from 'axios';
import { JWK } from 'jose/webcrypto/types';

export const api = {
  async getJWKS(url:string):Promise<JWK[]> {
    return axios.get<{keys:JWK[]}>(url).then((r) => r.data.keys);
  },
};
