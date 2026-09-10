import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:5000/api"),
  withCredentials: true,
  timeout: 15000,
});
export function setCsrf(token) {
  if (token) api.defaults.headers.common["X-CSRF-Token"] = token;
  else delete api.defaults.headers.common["X-CSRF-Token"];
}
export const errorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.errors
    ?.map((e) => `${e.field}: ${e.message}`)
    .join(". ") ||
  "Could not reach Foodie. Please try again.";

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !["/auth/staff", "/auth/google"].includes(error.config?.url)
    )
      window.dispatchEvent(new Event("foodie-session-expired"));
    return Promise.reject(error);
  },
);
