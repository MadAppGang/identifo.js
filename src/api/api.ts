import axios from 'axios';

const authInstance = axios.create({

});

export const api = {
  async renewToken(url:string):Promise<string> {
    const c = await authInstance.get<string>(url);
    return c.data;
  },
};
