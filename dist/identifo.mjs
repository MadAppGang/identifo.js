import axios from 'axios';

var APIErrorCodes;
(function(APIErrorCodes2) {
  APIErrorCodes2["PleaseEnableTFA"] = "error.api.request.2fa.please_enable";
})(APIErrorCodes || (APIErrorCodes = {}));
var TFAType;
(function(TFAType2) {
  TFAType2["TFATypeApp"] = "app";
  TFAType2["TFATypeSMS"] = "sms";
  TFAType2["TFATypeEmail"] = "email";
})(TFAType || (TFAType = {}));
class ApiError extends Error {
  constructor(error) {
    super(error?.message || "Unknown API error");
    this.detailedMessage = error?.detailed_message;
    this.id = error?.id;
    this.status = error?.status;
  }
}

const APP_ID_HEADER_KEY = "X-Identifo-Clientid";
const AUTHORIZATION_HEADER_KEY = "Authorization";
class Api {
  constructor(config, tokenService) {
    this.config = config;
    this.tokenService = tokenService;
    this.authInstance = axios.create();
    this.catchHandler = (e) => {
      throw new ApiError(e.response?.data.error);
    };
    this.authInstance = axios.create({
      baseURL: `${config.url}`,
      headers: {
        [APP_ID_HEADER_KEY]: config.appId
      }
    });
  }
  async getUser() {
    if (!this.tokenService.getToken()?.token) {
      throw new Error("No token in token service.");
    }
    return this.authInstance.get("/me", {
      headers: {
        [AUTHORIZATION_HEADER_KEY]: `Bearer ${this.tokenService.getToken()?.token}`
      }
    }).then((r) => r.data).catch(this.catchHandler);
  }
  async renewToken() {
    if (!this.tokenService.getToken("refresh")?.token) {
      throw new Error("No token in token service.");
    }
    return this.authInstance.get("/auth/renew", {
      headers: {
        [AUTHORIZATION_HEADER_KEY]: `Bearer ${this.tokenService.getToken("refresh")?.token}`
      }
    }).then((r) => r.data).then((r) => this.storeToken(r)).catch(this.catchHandler);
  }
  async updateUser(user) {
    if (!this.tokenService.getToken()?.token) {
      throw new Error("No token in token service.");
    }
    return this.authInstance.put("/me", user, {
      headers: {
        [AUTHORIZATION_HEADER_KEY]: `Bearer ${this.tokenService.getToken("refresh")?.token}`
      }
    }).then((r) => r.data).catch(this.catchHandler);
  }
  async login(username, password, deviceToken, scopes) {
    const data = {
      username,
      password,
      device_token: deviceToken,
      scopes
    };
    return this.authInstance.post("/auth/login", data).then((r) => r.data).then((r) => this.storeToken(r)).catch(this.catchHandler);
  }
  async register(username, password, email, phone) {
    const data = {
      username,
      password,
      email,
      phone
    };
    return this.authInstance.post("/auth/register", data).then((r) => r.data).then((r) => this.storeToken(r)).catch(this.catchHandler);
  }
  async requestResetPassword(email) {
    const data = {
      email
    };
    return this.authInstance.post("/auth/request_reset_password", data).then((r) => r.data).catch(this.catchHandler);
  }
  async resetPassword(password) {
    if (!this.tokenService.getToken()?.token) {
      throw new Error("No token in token service.");
    }
    const data = {
      password
    };
    return this.authInstance.post("/auth/reset_password", data, {
      headers: {
        [AUTHORIZATION_HEADER_KEY]: `Bearer ${this.tokenService.getToken()?.token}`
      }
    }).then((r) => r.data).catch(this.catchHandler);
  }
  async getAppSettings() {
    return this.authInstance.get("/auth/app_settings").then((r) => r.data).catch(this.catchHandler);
  }
  async enableTFA() {
    if (!this.tokenService.getToken()?.token) {
      throw new Error("No token in token service.");
    }
    return this.authInstance.put("/auth/tfa/enable", {}, { headers: { [AUTHORIZATION_HEADER_KEY]: `BEARER ${this.tokenService.getToken()?.token}` } }).then((r) => r.data).catch(this.catchHandler);
  }
  async verifyTFA(code, scopes) {
    if (!this.tokenService.getToken()?.token) {
      throw new Error("No token in token service.");
    }
    return this.authInstance.post("/auth/tfa/login", { tfa_code: code, scopes }, { headers: { [AUTHORIZATION_HEADER_KEY]: `BEARER ${this.tokenService.getToken()?.token}` } }).then((r) => r.data).then((r) => this.storeToken(r)).catch(this.catchHandler);
  }
  storeToken(response) {
    if (response.access_token) {
      this.tokenService.saveToken(response.access_token, "access");
    }
    if (response.refresh_token) {
      this.tokenService.saveToken(response.refresh_token, "refresh");
    }
    return response;
  }
}

const jwtRegex = /^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-=]*$)/;
const INVALID_TOKEN_ERROR = "Empty or invalid token";
const TOKEN_QUERY_KEY = "token";
const REFRESH_TOKEN_QUERY_KEY = "refresh_token";

const Iframe = {
  create() {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    return iframe;
  },
  remove(iframe) {
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 0);
  },
  captureMessage(iframe, src) {
    return new Promise((resolve, reject) => {
      const handleMessage = (event) => {
        if (event.data.error)
          reject(event.data.error);
        resolve(event.data.accessToken);
        window.removeEventListener("message", handleMessage);
      };
      window.addEventListener("message", handleMessage, false);
      iframe.src = src;
    });
  }
};

class CookieStorage {
  constructor() {
    this.isAccessible = false;
  }
  saveToken() {
    return true;
  }
  getToken() {
    throw new Error("Can not get token from HttpOnly");
  }
  deleteToken() {
  }
}

class StorageManager {
  constructor(storageType, accessKey, refreshKey) {
    this.preffix = "identifo_";
    this.storageType = "localStorage";
    this.access = `${this.preffix}access_token`;
    this.refresh = `${this.preffix}refresh_token`;
    this.isAccessible = true;
    this.access = accessKey ? this.preffix + accessKey : this.access;
    this.refresh = refreshKey ? this.preffix + refreshKey : this.refresh;
    this.storageType = storageType;
  }
  saveToken(token, tokenType) {
    if (token) {
      window[this.storageType].setItem(this[tokenType], token);
      return true;
    }
    return false;
  }
  getToken(tokenType) {
    return window[this.storageType].getItem(this[tokenType]) ?? "";
  }
  deleteToken(tokenType) {
    window[this.storageType].removeItem(this[tokenType]);
  }
}

class LocalStorage extends StorageManager {
  constructor(accessKey, refreshKey) {
    super("localStorage", accessKey, refreshKey);
  }
}

class SessionStorage extends StorageManager {
  constructor(accessKey, refreshKey) {
    super("sessionStorage", accessKey, refreshKey);
  }
}

class TokenService {
  constructor(tokenManager) {
    this.tokenManager = tokenManager || new LocalStorage();
  }
  async handleVerification(token, audience, issuer) {
    if (!this.tokenManager.isAccessible)
      return true;
    try {
      await this.validateToken(token, audience, issuer);
      this.saveToken(token);
      return true;
    } catch (err) {
      this.removeToken();
      return Promise.reject(err);
    }
  }
  async validateToken(token, audience, issuer) {
    if (!token)
      throw new Error(INVALID_TOKEN_ERROR);
    const jwtPayload = this.parseJWT(token);
    const isJwtExpired = this.isJWTExpired(jwtPayload);
    if (jwtPayload.aud?.includes(audience) && (!issuer || jwtPayload.iss === issuer) && !isJwtExpired) {
      return Promise.resolve(true);
    }
    throw new Error(INVALID_TOKEN_ERROR);
  }
  parseJWT(token) {
    const base64Url = token.split(".")[1];
    if (!base64Url)
      return { aud: [], iss: "", exp: 10 };
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(atob(base64).split("").map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`).join(""));
    return JSON.parse(jsonPayload);
  }
  isJWTExpired(token) {
    const now = new Date().getTime() / 1e3;
    if (token.exp && now > token.exp) {
      return true;
    }
    return false;
  }
  isAuthenticated(audience, issuer) {
    if (!this.tokenManager.isAccessible)
      return Promise.resolve(true);
    const token = this.tokenManager.getToken("access");
    return this.validateToken(token, audience, issuer);
  }
  saveToken(token, type = "access") {
    return this.tokenManager.saveToken(token, type);
  }
  removeToken(type = "access") {
    this.tokenManager.deleteToken(type);
  }
  getToken(type = "access") {
    const token = this.tokenManager.getToken(type);
    if (!token)
      return null;
    const jwtPayload = this.parseJWT(token);
    return { token, payload: jwtPayload };
  }
}

class UrlBuilder {
  constructor(config) {
    this.config = config;
  }
  getUrl(flow) {
    const scopes = JSON.stringify(this.config.scopes ?? []);
    const redirectUri = encodeURIComponent(this.config.redirectUri ?? window.location.href);
    const baseParams = `appId=${this.config.appId}&scopes=${scopes}`;
    const urlParams = `${baseParams}&callbackUrl=${redirectUri}`;
    const postLogoutRedirectUri = this.config.postLogoutRedirectUri ? `&callbackUrl=${encodeURIComponent(this.config.postLogoutRedirectUri)}` : `&callbackUrl=${redirectUri}&redirectUri=${this.config.url}/web/login?${encodeURIComponent(baseParams)}`;
    const urls = {
      signup: `${this.config.url}/web/register?${urlParams}`,
      signin: `${this.config.url}/web/login?${urlParams}`,
      logout: `${this.config.url}/web/logout?${baseParams}${postLogoutRedirectUri}`,
      renew: `${this.config.url}/web/token/renew?${baseParams}&redirectUri=${redirectUri}`,
      default: "default"
    };
    return urls[flow] || urls.default;
  }
  createSignupUrl() {
    return this.getUrl("signup");
  }
  createSigninUrl() {
    return this.getUrl("signin");
  }
  createLogoutUrl() {
    return this.getUrl("logout");
  }
  createRenewSessionUrl() {
    return this.getUrl("renew");
  }
}

class IdentifoAuth {
  constructor(config) {
    this.token = null;
    this.refreshToken = null;
    this.isAuth = false;
    this.config = { ...config, autoRenew: config.autoRenew ?? true };
    this.tokenService = new TokenService(config.tokenManager);
    this.urlBuilder = new UrlBuilder(this.config);
    this.api = new Api(config, this.tokenService);
  }
  init() {
    const token = this.tokenService.getToken();
    if (token) {
      const isExpired = this.tokenService.isJWTExpired(token.payload);
      if (isExpired) {
        this.renewSession().then((t) => this.handleToken(t)).catch(() => this.resetAuthValues());
      } else {
        this.handleToken(token.token);
      }
    }
  }
  handleToken(token) {
    const payload = this.tokenService.parseJWT(token);
    this.token = { token, payload };
    this.isAuth = true;
    this.tokenService.saveToken(token);
    if (this.renewSessionId) {
      window.clearTimeout(this.renewSessionId);
    }
    if (payload.exp) {
      this.renewSessionId = window.setTimeout(() => {
        if (this.config.autoRenew) {
          this.renewSession().then((t) => this.handleToken(t)).catch(() => this.resetAuthValues());
        } else {
          this.resetAuthValues();
        }
      }, (payload.exp - new Date().getTime() / 1e3 - 6e4) * 1e3);
    }
  }
  resetAuthValues() {
    this.token = null;
    this.isAuth = false;
    this.tokenService.removeToken();
  }
  signup() {
    window.location.href = this.urlBuilder.createSignupUrl();
  }
  signin() {
    window.location.href = this.urlBuilder.createSigninUrl();
  }
  logout() {
    this.tokenService.removeToken("access");
    window.location.href = this.urlBuilder.createLogoutUrl();
  }
  async handleAuthentication() {
    const { access } = this.getTokenFromUrl();
    if (!access) {
      return Promise.reject();
    }
    try {
      await this.tokenService.handleVerification(access, this.config.appId, this.config.issuer);
      this.handleToken(access);
      return await Promise.resolve(true);
    } catch (err) {
      return await Promise.reject();
    } finally {
      window.location.hash = "";
    }
  }
  getTokenFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokens = { access: "", refresh: "" };
    const accessToken = urlParams.get(TOKEN_QUERY_KEY);
    const refreshToken = urlParams.get(REFRESH_TOKEN_QUERY_KEY);
    if (refreshToken && jwtRegex.test(refreshToken)) {
      tokens.refresh = refreshToken;
    }
    if (accessToken && jwtRegex.test(accessToken)) {
      tokens.access = accessToken;
    }
    return tokens;
  }
  getToken() {
    if (this.token) {
      return this.token;
    }
    return { token: "", payload: {} };
  }
  async renewSession() {
    try {
      const token = await this.renewSessionWithIframe();
      this.handleToken(token);
      return await Promise.resolve(token);
    } catch (err) {
      return Promise.reject();
    }
  }
  async renewSessionWithToken() {
    try {
      const r = await this.api.renewToken().then((l) => l.access_token || "");
      return r;
    } catch (err) {
      return Promise.resolve("");
    }
  }
  async renewSessionWithIframe() {
    const iframe = Iframe.create();
    const timeout = setTimeout(() => {
      Iframe.remove(iframe);
      throw new Error("Timeout expired");
    }, 3e4);
    try {
      const token = await Iframe.captureMessage(iframe, this.urlBuilder.createRenewSessionUrl());
      await this.tokenService.handleVerification(token, this.config.appId, this.config.issuer);
      return token;
    } catch (err) {
      return Promise.reject(err);
    } finally {
      clearTimeout(timeout);
      Iframe.remove(iframe);
    }
  }
}

export { APIErrorCodes, ApiError, CookieStorage as CookieStorageManager, IdentifoAuth, LocalStorage as LocalStorageManager, SessionStorage as SessionStorageManager, TFAType };
//# sourceMappingURL=identifo.mjs.map