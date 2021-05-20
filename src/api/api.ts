import axios, { AxiosError, AxiosInstance } from 'axios';
import { IdentifoConfig } from '../types/types';
import {
  AppSettingsResponse,
  EnableTFAResponse,
  LoginResponse,
  SuccessResponse,
  UpdateUser,
  User,
  ApiRequestError,
  ApiError,
} from './model';

const APP_ID_HEADER_KEY = 'X-Identifo-Clientid';
const AUTHORIZATION_HEADER_KEY = 'Authorization';

export class Api {
  authInstance: AxiosInstance = axios.create();

  catchHandler = (e: AxiosError<ApiRequestError>): never => {
    throw new ApiError(e.response?.data.error);
  };

  constructor(config: IdentifoConfig) {
    this.authInstance = axios.create({
      baseURL: `${config.url}`,
      headers: {
        [APP_ID_HEADER_KEY]: config.appId,
      },
    });
  }

  async getUser(token: string): Promise<User> {
    return this.authInstance
      .get<User>('/me', {
        headers: {
          [AUTHORIZATION_HEADER_KEY]: `Bearer ${token}`,
        },
      })
      .then((r) => r.data)
      .catch(this.catchHandler);
  }

  async renewToken(token: string): Promise<LoginResponse> {
    return this.authInstance
      .get<LoginResponse>('/auth/renew', {
        headers: {
          [AUTHORIZATION_HEADER_KEY]: `Bearer ${token}`,
        },
      })
      .then((r) => r.data)
      .catch(this.catchHandler);
  }

  async updateUser(user: UpdateUser, token: string): Promise<User> {
    return this.authInstance
      .put<User>('/me', user, {
        headers: {
          [AUTHORIZATION_HEADER_KEY]: `Bearer ${token}`,
        },
      })
      .then((r) => r.data)
      .catch(this.catchHandler);
  }

  async login(username: string, password: string, deviceToken: string, scopes: string[]): Promise<LoginResponse> {
    const data = {
      username,
      password,
      device_token: deviceToken,
      scopes,
    };

    return this.authInstance
      .post<LoginResponse>('/auth/login', data)
      .then((r) => r.data)
      .catch(this.catchHandler);
  }

  async register(username: string, password: string, email: string, phone: string): Promise<LoginResponse> {
    const data = {
      username,
      password,
      email,
      phone,
    };

    return this.authInstance
      .post<LoginResponse>('/auth/register', data)
      .then((r) => r.data)
      .catch(this.catchHandler);
  }

  async requestResetPassword(email: string): Promise<SuccessResponse> {
    const data = {
      email,
    };

    return this.authInstance
      .post<SuccessResponse>('/auth/request_reset_password', data)
      .then((r) => r.data)
      .catch(this.catchHandler);
  }

  async resetPassword(password: string, token: string): Promise<SuccessResponse> {
    const data = {
      password,
    };

    return this.authInstance
      .post<SuccessResponse>('/auth/reset_password', data, {
        headers: {
          [AUTHORIZATION_HEADER_KEY]: `Bearer ${token}`,
        },
      })
      .then((r) => r.data)
      .catch(this.catchHandler);
  }

  async getAppSettings(): Promise<AppSettingsResponse> {
    return this.authInstance
      .get<AppSettingsResponse>('/auth/app_settings')
      .then((r) => r.data)
      .catch(this.catchHandler);
  }

  async enableTFA(token: string): Promise<EnableTFAResponse> {
    return this.authInstance
      .put<EnableTFAResponse>('/auth/tfa/enable', {}, { headers: { [AUTHORIZATION_HEADER_KEY]: `BEARER ${token}` } })
      .then((r) => r.data)
      .catch(this.catchHandler);
  }

  async verifyTFA(code: string, scopes: string[], token: string): Promise<LoginResponse> {
    return this.authInstance
      .post<LoginResponse>(
        '/auth/tfa/login',
        { tfa_code: code, scopes },
        { headers: { [AUTHORIZATION_HEADER_KEY]: `BEARER ${token}` } },
      )
      .then((r) => r.data)
      .catch(this.catchHandler);
  }
}
