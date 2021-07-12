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
  baseUrl: string;

  appId: string;

  defaultHeaders = {
    [APP_ID_HEADER_KEY]: '',
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  catchNetworkErrorHandler = (e: TypeError): never => {
    if (
      e.message === 'Network Error' ||
      e.message === 'Failed to fetch' ||
      e.message === 'Preflight response is not successful' ||
      e.message.indexOf('is not allowed by Access-Control-Allow-Origin') > -1
    ) {
      // eslint-disable-next-line no-console
      console.error(e.message);
      throw new ApiError({
        id: APIErrorCodes.NetworkError,
        status: 0,
        message: 'Configuration error',
        detailed_message:
          'Please check Identifo URL and add "' +
          `${window.location.protocol}//${window.location.host}" ` +
          'to "REDIRECT URLS" in Identifo app settings.',
      });
    }
    throw e;
  };

  checkStatusCodeAndGetJSON = async (r: Response): Promise<any> => {
    if (!r.ok) {
      const error = (await r.json()) as ApiRequestError;
      throw new ApiError(error?.error);
    }
    return r.json();
  };

  constructor(private config: IdentifoConfig, private tokenService: TokenService) {
    // remove trailing slash if exist
    this.baseUrl = config.url.replace(/\/$/, '');
    this.defaultHeaders[APP_ID_HEADER_KEY] = config.appId;
    this.appId = config.appId;
  }

  get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.send(path, { method: 'GET', ...options });
  }

  put<T>(path: string, data: unknown, options?: RequestInit): Promise<T> {
    return this.send(path, { method: 'PUT', body: JSON.stringify(data), ...options });
  }

  post<T>(path: string, data: unknown, options?: RequestInit): Promise<T> {
    return this.send(path, { method: 'POST', body: JSON.stringify(data), ...options });
  }

  send<T>(path: string, options?: RequestInit): Promise<T> {
    const init = { ...options };
    init.headers = {
      ...init.headers,
      ...this.defaultHeaders,
    };
    return fetch(`${this.baseUrl}${path}`, init)
      .catch(this.catchNetworkErrorHandler)
      .then(this.checkStatusCodeAndGetJSON)
      .then((value) => value as T);
  }

  async getUser(): Promise<User> {
    if (!this.tokenService.getToken()?.token) {
      throw new Error('No token in token service.');
    }
    return this.get<User>('/me', {
      headers: {
        [AUTHORIZATION_HEADER_KEY]: `Bearer ${this.tokenService.getToken()?.token}`,
      },
    });
  }

  async renewToken(): Promise<LoginResponse> {
    if (!this.tokenService.getToken('refresh')?.token) {
      throw new Error('No token in token service.');
    }
    return this.post<LoginResponse>(
      '/auth/token',
      {},
      {
        headers: {
          [AUTHORIZATION_HEADER_KEY]: `Bearer ${this.tokenService.getToken('refresh')?.token}`,
        },
      },
    ).then((r) => this.storeToken(r));
  }

  async updateUser(user: UpdateUser): Promise<User> {
    if (!this.tokenService.getToken()?.token) {
      throw new Error('No token in token service.');
    }
    return this.put<User>('/me', user, {
      headers: {
        [AUTHORIZATION_HEADER_KEY]: `Bearer ${this.tokenService.getToken('access')?.token}`,
      },
    });
  }

  async login(username: string, password: string, deviceToken: string, scopes: string[]): Promise<LoginResponse> {
    const data = {
      username,
      password,
      device_token: deviceToken,
      scopes,
    };

    return this.post<LoginResponse>('/auth/login', data).then((r) => this.storeToken(r));
  }

  async register(username: string, password: string): Promise<LoginResponse> {
    const data = {
      username,
      password,
    };

    return this.post<LoginResponse>('/auth/register', data).then((r) => this.storeToken(r));
  }

  async requestResetPassword(email: string): Promise<SuccessResponse> {
    const data = {
      email,
    };

    return this.post<SuccessResponse>('/auth/request_reset_password', data);
  }

  async resetPassword(password: string): Promise<SuccessResponse> {
    if (!this.tokenService.getToken()?.token) {
      throw new Error('No token in token service.');
    }
    const data = {
      password,
    };

    return this.post<SuccessResponse>('/auth/reset_password', data, {
      headers: {
        [AUTHORIZATION_HEADER_KEY]: `Bearer ${this.tokenService.getToken()?.token}`,
      },
    });
  }

  async getAppSettings(): Promise<AppSettingsResponse> {
    return this.get<AppSettingsResponse>('/auth/app_settings');
  }

  async enableTFA(): Promise<EnableTFAResponse> {
    if (!this.tokenService.getToken()?.token) {
      throw new Error('No token in token service.');
    }
    return this.put<EnableTFAResponse>(
      '/auth/tfa/enable',
      {},
      {
        headers: { [AUTHORIZATION_HEADER_KEY]: `BEARER ${this.tokenService.getToken()?.token}` },
      },
    );
  }

  async verifyTFA(code: string, scopes: string[]): Promise<LoginResponse> {
    if (!this.tokenService.getToken()?.token) {
      throw new Error('No token in token service.');
    }
    return this.post<LoginResponse>(
      '/auth/tfa/login',
      { tfa_code: code, scopes },
      { headers: { [AUTHORIZATION_HEADER_KEY]: `BEARER ${this.tokenService.getToken()?.token}` } },
    ).then((r) => this.storeToken(r));
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
