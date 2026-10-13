import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? ""
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}
