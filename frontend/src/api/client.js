import axios from "axios";

/** Where the bearer token lives between visits. */
export const TOKEN_KEY = "sharewise.token";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

/** Axios instance for the Sharewise API: adds the bearer token and drops it on a 401. */
const client = axios.create({ baseURL: `${import.meta.env.VITE_BACKEND_URL ?? ""}/api` });

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch {
        /* storage unavailable */
      }
    }
    return Promise.reject(error);
  }
);

export default client;
