import axios, { AxiosError, AxiosInstance } from 'axios';
import TokenService from '../tokenService';
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
  APIErrorCodes,
} from './model';

const APP_ID_HEADER_KEY = 'X-Identifo-Clientid';
const AUTHORIZATION_HEADER_KEY = 'Authorization';

export class Api {
  authInstance: AxiosInstance = axios.create();

  catchHandler = (e: AxiosError<ApiRequestError>): never => {
    if (e.message === 'Network Error') {
      throw new ApiError({
        id: APIErrorCodes.NetworkError,
        status: 0,
        message: e.message,
        detailed_message: 'Please check Identifo URL and add REDIRECT URLS in Identifo app settings.',
      });
    }
    throw new ApiError(e.response?.data.error);
  };

  constructor(private config: IdentifoConfig, private tokenService: TokenService) {
    this.authInstance = axios.create({
      baseURL: `${config.url}`,
      headers: {
        [APP_ID_HEADER_KEY]: config.appId,
      },
    });
  }

  async getUser(): Promise<User> {
    if (!this.tokenService.getToken()?.token) {
      throw new Error('No token in token service.');
    }
    return this.authInstance
      .get<User>('/me', {
        headers: {
          [AUTHORIZATION_HEADER_KEY]: `Bearer ${this.tokenService.getToken()?.token}`,
        },
      })
      .then((r) => r.data)
      .catch(this.catchHandler);
  }

  async renewToken(): Promise<LoginResponse> {
    if (!this.tokenService.getToken('refresh')?.token) {
      throw new Error('No token in token service.');
    }
    return this.authInstance
      .get<LoginResponse>('/auth/renew', {
        headers: {
          [AUTHORIZATION_HEADER_KEY]: `Bearer ${this.tokenService.getToken('refresh')?.token}`,
        },
      })
      .then((r) => r.data)
      .then((r) => this.storeToken(r))
      .catch(this.catchHandler);
  }

  async updateUser(user: UpdateUser): Promise<User> {
    if (!this.tokenService.getToken()?.token) {
      throw new Error('No token in token service.');
    }
    return this.authInstance
      .put<User>('/me', user, {
        headers: {
          [AUTHORIZATION_HEADER_KEY]: `Bearer ${this.tokenService.getToken('refresh')?.token}`,
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
      .then((r) => this.storeToken(r))
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
      .then((r) => this.storeToken(r))
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

  async resetPassword(password: string): Promise<SuccessResponse> {
    if (!this.tokenService.getToken()?.token) {
      throw new Error('No token in token service.');
    }
    const data = {
      password,
    };

    return this.authInstance
      .post<SuccessResponse>('/auth/reset_password', data, {
        headers: {
          [AUTHORIZATION_HEADER_KEY]: `Bearer ${this.tokenService.getToken()?.token}`,
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

  async enableTFA(): Promise<EnableTFAResponse> {
    if (!this.tokenService.getToken()?.token) {
      throw new Error('No token in token service.');
    }
    return this.authInstance
      .put<EnableTFAResponse>(
        '/auth/tfa/enable',
        {},
        { headers: { [AUTHORIZATION_HEADER_KEY]: `BEARER ${this.tokenService.getToken()?.token}` } },
      )
      .then((r) => r.data)
      .catch(this.catchHandler);
  }

  async verifyTFA(code: string, scopes: string[]): Promise<LoginResponse> {
    if (!this.tokenService.getToken()?.token) {
      throw new Error('No token in token service.');
    }
    return this.authInstance
      .post<LoginResponse>(
        '/auth/tfa/login',
        { tfa_code: code, scopes },
        { headers: { [AUTHORIZATION_HEADER_KEY]: `BEARER ${this.tokenService.getToken()?.token}` } },
      )
      .then((r) => r.data)
      .then((r) => this.storeToken(r))
      .catch(this.catchHandler);
  }

  storeToken(response: LoginResponse): LoginResponse {
    if (response.access_token) {
      this.tokenService.saveToken(response.access_token, 'access');
    }
    if (response.refresh_token) {
      this.tokenService.saveToken(response.refresh_token, 'refresh');
    }
    return response;
  }
}
