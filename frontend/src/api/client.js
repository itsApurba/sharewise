import axios from "axios";

const TOKEN_KEY = "sharewise.token";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked: the session lasts until reload.
  }
};

/** Axios instance for the Sharewise API: adds the bearer token, drops it on a 401. */
const client = axios.create({ baseURL: `${import.meta.env.VITE_BACKEND_URL}/api` });

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) setToken(null);
    return Promise.reject(error);
  }
);

/** The API's error message (or a generic one) for a failed request. */
export const errorMessage = (error) => error?.response?.data?.error?.message ?? "Something went wrong. Try again.";

export default client;
