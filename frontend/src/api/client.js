import axios from "axios";

/*
 * The one axios instance every hook uses. It sends the bearer token and, when the
 * API rejects a token we sent (401), forgets it and tells the app to log out.
 */

const TOKEN_KEY = "sharewise.token";

let token = null;
try {
  token = localStorage.getItem(TOKEN_KEY);
} catch {
  token = null;
}

export const getToken = () => token;

export const setToken = (next) => {
  token = next || null;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage can be blocked (private mode); the token still lives in memory for this tab.
  }
};

const unauthorizedListeners = new Set();

/** Runs `listener` whenever a sent token is rejected. Returns an unsubscribe function. */
export const onUnauthorized = (listener) => {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
};

const client = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL ?? ""}/api`,
});

client.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const sentToken = error.config?.headers?.Authorization;
    if (error.response?.status === 401 && sentToken) {
      setToken(null);
      unauthorizedListeners.forEach((listener) => listener());
    }
    return Promise.reject(error);
  }
);

/**
 * Normalizes any request error into `{ status, code, message, fields }`.
 * `fields` maps input names to messages for inline form errors.
 */
export const apiError = (error) => {
  const body = error?.response?.data?.error;
  if (body) {
    return { status: error.response.status, code: body.code, message: body.message, fields: body.fields ?? {} };
  }
  return {
    status: error?.response?.status ?? 0,
    code: "NETWORK",
    message: error?.response ? "Something went wrong. Please try again." : "Cannot reach Sharewise. Check your connection.",
    fields: {},
  };
};

export default client;
