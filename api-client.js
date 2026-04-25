(function () {
  "use strict";

  function resolveApiBase() {
    var configured =
      (window.UNNSSAAConfig && window.UNNSSAAConfig.apiBaseUrl) ||
      window.UNNSSAA_API_BASE_URL ||
      window.__UNNSSAA_API_BASE_URL__ ||
      "/api";

    return String(configured).replace(/\/$/, "");
  }

  var API_BASE = resolveApiBase();
  var isRefreshing = false;
  var refreshPromise = null;

  function getAccessToken() {
    return localStorage.getItem("unnssaa_access_token") || "";
  }

  function setAuthSession(payload) {
    if (!payload) return;
    if (payload.accessToken) {
      localStorage.setItem("unnssaa_access_token", payload.accessToken);
    }
    if (payload.refreshToken) {
      localStorage.setItem("unnssaa_refresh_token", payload.refreshToken);
    }
    if (payload.user) {
      localStorage.setItem("unnssaa_current_user", JSON.stringify(payload.user));
    }
  }

  function getRefreshToken() {
    return localStorage.getItem("unnssaa_refresh_token") || "";
  }

  function clearAuthSession() {
    localStorage.removeItem("unnssaa_access_token");
    localStorage.removeItem("unnssaa_refresh_token");
    localStorage.removeItem("unnssaa_current_user");
  }

  async function refreshAccessToken() {
    var refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error("Session expired. Please login again.");
    }

    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = fetch(API_BASE + "/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refreshToken })
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok || !data || !data.data || !data.data.accessToken) {
            throw new Error((data && data.message) || "Unable to refresh session");
          }
          localStorage.setItem("unnssaa_access_token", data.data.accessToken);
          return data.data.accessToken;
        });
      })
      .finally(function () {
        isRefreshing = false;
        refreshPromise = null;
      });

    return refreshPromise;
  }

  async function request(path, options, retrying) {
    var opts = Object.assign({ method: "GET" }, options || {});
    var headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    var token = getAccessToken();

    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    var response = await fetch(API_BASE + path, {
      method: opts.method,
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });

    var data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      if (response.status === 401 && !retrying) {
        try {
          await refreshAccessToken();
          return request(path, options, true);
        } catch (refreshError) {
          clearAuthSession();
          throw refreshError;
        }
      }

      var message = (data && data.message) || "Request failed";
      throw new Error(message);
    }

    return data;
  }

  async function login(email, password) {
    // Mock login for frontend testing without a backend
    if (email === "test@unnssaa.org" && password === "TestUser2026!") {
      var mockMember = { accessToken: "mock_token", refreshToken: "mock_refresh", user: { id: "1", email: email, fullName: "Test User", role: "MEMBER" } };
      setAuthSession(mockMember);
      return mockMember;
    }
    if (email === "admin@unnssaa.org" && password === "Admin2026!") {
      var mockAdmin = { accessToken: "mock_token", refreshToken: "mock_refresh", user: { id: "2", email: email, fullName: "Admin User", role: "SUPERADMIN" } };
      setAuthSession(mockAdmin);
      return mockAdmin;
    }

    var result = await request("/auth/login", {
      method: "POST",
      body: { email: email, password: password }
    });

    setAuthSession(result.data);
    return result.data;
  }

  async function logout() {
    var refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await request("/auth/logout", {
          method: "POST",
          body: { refreshToken: refreshToken }
        }, true);
      } catch (error) {
      }
    }
    clearAuthSession();
  }

  window.UNNSSAAApi = {
    request: request,
    login: login,
    logout: logout,
    setAuthSession: setAuthSession,
    clearAuthSession: clearAuthSession,
    setBaseUrl: function (baseUrl) {
      API_BASE = String(baseUrl || "/api").replace(/\/$/, "");
    }
  };
})();
