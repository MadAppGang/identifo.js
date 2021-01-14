/* eslint-disable */

import axios from 'axios';

const authInstance = axios.create({
  baseURL: 'http://localhost:8081/api',
});

export const api = {
  async getMe(token:string):Promise<any> {
    return authInstance.get('/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.data);
  },
};
