import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Dev branch backend (tars-dev mühiti) — real domen olduğu üçün telefon/kompüter
// eyni şəbəkədə olmasa da işləyir. Görürsən nə "Ət Satışı" datası varsa elə budur.
const BASE_URL = "https://api-tars-dev.qurbanet.az/api";
// const BASE_URL = "http://10.1.31.195:4000/api"; // lokal backend (eyni Wi-Fi lazımdır)
// const BASE_URL = "https://api.qurbanet.az/api"; // production

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
