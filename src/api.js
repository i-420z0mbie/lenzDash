// src/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constant";

const BASE_URL = "https://binarylenz.mycasaz.com/";

// Create API instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


const skipAuthPaths = [
  "main/students/login",
  "core/token/",
  "core/token/refresh",
];

// Request interceptor - attach Authorization header when we have an access token
api.interceptors.request.use(
  async (config) => {
    if (!config || !config.url) return config;

    // debug log: request about to be sent
    console.log("API -> Request:", config.method?.toUpperCase(), config.url);

    // do not attach auth for skip paths
    if (skipAuthPaths.some((p) => config.url.includes(p))) {
      console.log("API -> Skipping auth for", config.url);
      return config;
    }

    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (token) {
        // keep server's expected scheme
        config.headers.Authorization = `Student ${token}`;
        console.log("API -> Authorization header set (Student <token>)");
      }
    } catch (e) {
      console.warn("API -> Failed to read auth token:", e.message);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with logging and refresh flow
const refreshToken = async () => {
  try {
    const refresh = await AsyncStorage.getItem(REFRESH_TOKEN);
    if (!refresh) {
      await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
      throw new Error("NO_REFRESH_TOKEN");
    }
    const response = await axios.post(`${BASE_URL}/core/token/refresh/`, { refresh });
    const newAccess = response.data.access;
    await AsyncStorage.setItem(ACCESS_TOKEN, newAccess);
    return newAccess;
  } catch (err) {
    await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
    throw err;
  }
};

api.interceptors.response.use(
  (response) => {
    // debug log for successful responses
    console.log("API <- Response:", response.status, response.config?.url);
    return response;
  },
  async (error) => {
    if (!error.response) {
      console.error("API <- Network Error:", error.message);
      return Promise.reject({ ...error, message: "Network Error" });
    }

    const originalRequest = error.config || {};

    // If 401 and we haven't retried, attempt refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccess = await refreshToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Student ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        if (refreshError && refreshError.message === "NO_REFRESH_TOKEN") {
          return Promise.resolve({ data: null });
        }
        return Promise.reject(refreshError);
      }
    }

    // else - log error
    console.error("API <- Error:", error.response.status, error.config?.url, error.response.data);
    return Promise.reject(error);
  }
);

// Helper to directly send push token to backend (useful for testing)
export const sendPushTokenToBackend = async (token) => {
  try {
    console.log("sendPushTokenToBackend -> POST /main/push_notification/ token:", token);
    return await api.post("/main/push_notification/", { token });
  } catch (err) {
    console.error("sendPushTokenToBackend error:", err.response?.status, err.response?.data || err.message);
    throw err;
  }
};

export const unregisterPushToken = async (token) => {
  try {
    return await api.post("/main/push_notification/unregister/", { token });
  } catch (error) {
    console.error("Push token unregistration error:", error.response?.data || error.message);
    throw error;
  }
};

export default api;
