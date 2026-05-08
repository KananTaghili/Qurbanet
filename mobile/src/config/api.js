import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { NativeModules } from "react-native";

function extractHost(value) {
  if (!value || typeof value !== "string") return "";

  try {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return new URL(value).hostname;
    }
  } catch {
    // Continue with plain host:port parsing.
  }

  return value.split(":")[0];
}

function resolveBaseUrl() {
  // Optional override for production builds or custom backend hosts.
  const explicitUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    Constants.expoConfig?.extra?.apiUrl ||
    Constants.manifest2?.extra?.apiUrl;

  if (explicitUrl) {
    return explicitUrl.endsWith("/api") ? explicitUrl : `${explicitUrl}/api`;
  }

  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.manifest2?.extra?.expoClient?.hostUri,
    Constants.manifest?.debuggerHost,
    NativeModules?.SourceCode?.scriptURL,
  ];

  const host = candidates.map(extractHost).find(Boolean) || "";

  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:5000/api`;
  }

  // Android emulator cannot reach localhost directly.
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://10.0.2.2:5000/api";
  }

  // Final fallback for local desktop testing.
  return "http://localhost:5000/api";
}

const BASE_URL = resolveBaseUrl();
console.log(`[API] BASE_URL: ${BASE_URL}`);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "bypass-tunnel-reminder": "true",
  },
});

// Request interceptor - token əlavə et
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - xəta idarəetməsi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(["token", "user"]);
    }
    return Promise.reject(error);
  },
);

export default api;
export { BASE_URL };
