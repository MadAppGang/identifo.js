var APIErrorCodes;
(function(APIErrorCodes2) {
  APIErrorCodes2["PleaseEnableTFA"] = "error.api.request.2fa.please_enable";
  APIErrorCodes2["NetworkError"] = "error.network";
})(APIErrorCodes || (APIErrorCodes = {}));
var TFAType;
(function(TFAType2) {
  TFAType2["TFATypeApp"] = "app";
  TFAType2["TFATypeSMS"] = "sms";
  TFAType2["TFATypeEmail"] = "email";
})(TFAType || (TFAType = {}));
class ApiError extends Error {
  constructor(error) {
    super((error == null ? void 0 : error.message) || "Unknown API error");
    this.detailedMessage = error == null ? void 0 : error.detailed_message;
    this.id = error == null ? void 0 : error.id;
    this.status = error == null ? void 0 : error.status;
  }
}

var __defProp$1 = Object.defineProperty;
var __getOwnPropSymbols$1 = Object.getOwnPropertySymbols;
var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
var __propIsEnum$1 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$1 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$1.call(b, prop))
      __defNormalProp$1(a, prop, b[prop]);
  if (__getOwnPropSymbols$1)
    for (var prop of __getOwnPropSymbols$1(b)) {
      if (__propIsEnum$1.call(b, prop))
        __defNormalProp$1(a, prop, b[prop]);
    }
  return a;
};
var __async$2 = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
const APP_ID_HEADER_KEY = "X-Identifo-Clientid";
const AUTHORIZATION_HEADER_KEY = "Authorization";
class Api {
  constructor(config, tokenService) {
    this.config = config;
    this.tokenService = tokenService;
    this.defaultHeaders = {
      [APP_ID_HEADER_KEY]: "",
      Accept: "application/json",
      "Content-Type": "application/json"
    };
    this.catchNetworkErrorHandler = (e) => {
      if (e.message === "Network Error" || e.message === "Failed to fetch" || e.message === "Preflight response is not successful" || e.message.indexOf("is not allowed by Access-Control-Allow-Origin") > -1) {
        console.error(e.message);
        throw new ApiError({
          id: APIErrorCodes.NetworkError,
          status: 0,
          message: "Configuration error",
          detailed_message: `Please check Identifo URL and add "${window.location.protocol}//${window.location.host}" to "REDIRECT URLS" in Identifo app settings.`
        });
      }
      throw e;
    };
    this.checkStatusCodeAndGetJSON = (r) => __async$2(this, null, function* () {
      if (!r.ok) {
        const error = yield r.json();
        throw new ApiError(error == null ? void 0 : error.error);
      }
      return r.json();
    });
    this.baseUrl = config.url.replace(/\/$/, "");
    this.defaultHeaders[APP_ID_HEADER_KEY] = config.appId;
    this.appId = config.appId;
  }
  get(path, options) {
    return this.send(path, __spreadValues$1({ method: "GET" }, options));
  }
  put(path, data, options) {
    return this.send(path, __spreadValues$1({ method: "PUT", body: JSON.stringify(data) }, options));
  }
  post(path, data, options) {
    return this.send(path, __spreadValues$1({ method: "POST", body: JSON.stringify(data) }, options));
  }
  send(path, options) {
    const init = __spreadValues$1({}, options);
    init.headers = __spreadValues$1(__spreadValues$1({}, init.headers), this.defaultHeaders);
    return fetch(`${this.baseUrl}${path}`, init).catch(this.catchNetworkErrorHandler).then(this.checkStatusCodeAndGetJSON).then((value) => value);
  }
  getUser() {
    return __async$2(this, null, function* () {
      var _a, _b;
      if (!((_a = this.tokenService.getToken()) == null ? void 0 : _a.token)) {
        throw new Error("No token in token service.");
      }
      return this.get("/me", {
        headers: {
          [AUTHORIZATION_HEADER_KEY]: `Bearer ${(_b = this.tokenService.getToken()) == null ? void 0 : _b.token}`
        }
      });
    });
  }
  renewToken() {
    return __async$2(this, null, function* () {
      var _a, _b;
      if (!((_a = this.tokenService.getToken("refresh")) == null ? void 0 : _a.token)) {
        throw new Error("No token in token service.");
      }
      return this.post("/auth/token", {}, {
        headers: {
          [AUTHORIZATION_HEADER_KEY]: `Bearer ${(_b = this.tokenService.getToken("refresh")) == null ? void 0 : _b.token}`
        }
      }).then((r) => this.storeToken(r));
    });
  }
  updateUser(user) {
    return __async$2(this, null, function* () {
      var _a, _b;
      if (!((_a = this.tokenService.getToken()) == null ? void 0 : _a.token)) {
        throw new Error("No token in token service.");
      }
      return this.put("/me", user, {
        headers: {
          [AUTHORIZATION_HEADER_KEY]: `Bearer ${(_b = this.tokenService.getToken("access")) == null ? void 0 : _b.token}`
        }
      });
    });
  }
  login(username, password, deviceToken, scopes) {
    return __async$2(this, null, function* () {
      const data = {
        username,
        password,
        device_token: deviceToken,
        scopes
      };
      return this.post("/auth/login", data).then((r) => this.storeToken(r));
    });
  }
  register(username, password) {
    return __async$2(this, null, function* () {
      const data = {
        username,
        password
      };
      return this.post("/auth/register", data).then((r) => this.storeToken(r));
    });
  }
  requestResetPassword(email) {
    return __async$2(this, null, function* () {
      const data = {
        email
      };
      return this.post("/auth/request_reset_password", data);
    });
  }
  resetPassword(password) {
    return __async$2(this, null, function* () {
      var _a, _b;
      if (!((_a = this.tokenService.getToken()) == null ? void 0 : _a.token)) {
        throw new Error("No token in token service.");
      }
      const data = {
        password
      };
      return this.post("/auth/reset_password", data, {
        headers: {
          [AUTHORIZATION_HEADER_KEY]: `Bearer ${(_b = this.tokenService.getToken()) == null ? void 0 : _b.token}`
        }
      });
    });
  }
  getAppSettings() {
    return __async$2(this, null, function* () {
      return this.get("/auth/app_settings");
    });
  }
  enableTFA() {
    return __async$2(this, null, function* () {
      var _a, _b;
      if (!((_a = this.tokenService.getToken()) == null ? void 0 : _a.token)) {
        throw new Error("No token in token service.");
      }
      return this.put("/auth/tfa/enable", {}, {
        headers: { [AUTHORIZATION_HEADER_KEY]: `BEARER ${(_b = this.tokenService.getToken()) == null ? void 0 : _b.token}` }
      });
    });
  }
  verifyTFA(code, scopes) {
    return __async$2(this, null, function* () {
      var _a, _b;
      if (!((_a = this.tokenService.getToken()) == null ? void 0 : _a.token)) {
        throw new Error("No token in token service.");
      }
      return this.post("/auth/tfa/login", { tfa_code: code, scopes }, { headers: { [AUTHORIZATION_HEADER_KEY]: `BEARER ${(_b = this.tokenService.getToken()) == null ? void 0 : _b.token}` } }).then((r) => this.storeToken(r));
    });
  }
  logout() {
    return __async$2(this, null, function* () {
      var _a, _b, _c;
      if (!((_a = this.tokenService.getToken()) == null ? void 0 : _a.token)) {
        throw new Error("No token in token service.");
      }
      return this.post("/me/logout", {
        refresh_token: (_b = this.tokenService.getToken("refresh")) == null ? void 0 : _b.token
      }, {
        headers: {
          [AUTHORIZATION_HEADER_KEY]: `Bearer ${(_c = this.tokenService.getToken()) == null ? void 0 : _c.token}`
        }
      });
    });
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
    var _a;
    return (_a = window[this.storageType].getItem(this[tokenType])) != null ? _a : "";
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

var __async$1 = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
class TokenService {
  constructor(tokenManager) {
    this.tokenManager = tokenManager || new LocalStorage();
  }
  handleVerification(token, audience, issuer) {
    return __async$1(this, null, function* () {
      if (!this.tokenManager.isAccessible)
        return true;
      try {
        yield this.validateToken(token, audience, issuer);
        this.saveToken(token);
        return true;
      } catch (err) {
        this.removeToken();
        return Promise.reject(err);
      }
    });
  }
  validateToken(token, audience, issuer) {
    return __async$1(this, null, function* () {
      var _a;
      if (!token)
        throw new Error(INVALID_TOKEN_ERROR);
      const jwtPayload = this.parseJWT(token);
      const isJwtExpired = this.isJWTExpired(jwtPayload);
      if (((_a = jwtPayload.aud) == null ? void 0 : _a.includes(audience)) && (!issuer || jwtPayload.iss === issuer) && !isJwtExpired) {
        return Promise.resolve(true);
      }
      throw new Error(INVALID_TOKEN_ERROR);
    });
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
    var _a, _b;
    const scopes = JSON.stringify((_a = this.config.scopes) != null ? _a : []);
    const redirectUri = encodeURIComponent((_b = this.config.redirectUri) != null ? _b : window.location.href);
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

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
class IdentifoAuth {
  constructor(config) {
    this.token = null;
    this.refreshToken = null;
    this.isAuth = false;
    var _a;
    this.config = __spreadProps(__spreadValues({}, config), { autoRenew: (_a = config.autoRenew) != null ? _a : true });
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
  handleAuthentication() {
    return __async(this, null, function* () {
      const { access } = this.getTokenFromUrl();
      if (!access) {
        return Promise.reject();
      }
      try {
        yield this.tokenService.handleVerification(access, this.config.appId, this.config.issuer);
        this.handleToken(access);
        return yield Promise.resolve(true);
      } catch (err) {
        return yield Promise.reject();
      } finally {
        window.location.hash = "";
      }
    });
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
    const token = this.tokenService.getToken();
    if (token) {
      return token;
    }
    return { token: "", payload: {} };
  }
  renewSession() {
    return __async(this, null, function* () {
      try {
        const token = yield this.renewSessionWithIframe();
        this.handleToken(token);
        return yield Promise.resolve(token);
      } catch (err) {
        return Promise.reject();
      }
    });
  }
  renewSessionWithToken() {
    return __async(this, null, function* () {
      try {
        const r = yield this.api.renewToken().then((l) => l.access_token || "");
        return r;
      } catch (err) {
        return Promise.resolve("");
      }
    });
  }
  renewSessionWithIframe() {
    return __async(this, null, function* () {
      const iframe = Iframe.create();
      const timeout = setTimeout(() => {
        Iframe.remove(iframe);
        throw new Error("Timeout expired");
      }, 3e4);
      try {
        const token = yield Iframe.captureMessage(iframe, this.urlBuilder.createRenewSessionUrl());
        yield this.tokenService.handleVerification(token, this.config.appId, this.config.issuer);
        return token;
      } catch (err) {
        return Promise.reject(err);
      } finally {
        clearTimeout(timeout);
        Iframe.remove(iframe);
      }
    });
  }
}

export { APIErrorCodes, ApiError, CookieStorage as CookieStorageManager, IdentifoAuth, LocalStorage as LocalStorageManager, SessionStorage as SessionStorageManager, TFAType };
//# sourceMappingURL=identifo.mjs.map
