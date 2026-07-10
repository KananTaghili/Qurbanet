import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Local backend (dev makinanın LAN IP-si — telefon eyni WiFi-də olmalıdır)
const BASE_URL = "http://10.214.215.205:4000/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 25000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
export { BASE_URL };
