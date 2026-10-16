import axios from "axios";
import * as SecureStore from "expo-secure-store";


export const API_URL_DEV = "https://api.dentalhealthcareandimplantcentre.in/";

const API_URL = "https://api.dentalhealthcareandimplantcentre.in/api";

const client = axios.create({ baseURL: API_URL, timeout: 20000 });

const TOKEN_KEY = "dhic_patient_token";
const ROLE_KEY = "dhic_active_role"; // 'patient' | 'receptionist'

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const setPatientToken = (token) =>
  SecureStore.setItemAsync(TOKEN_KEY, token);
export const getPatientToken = () => SecureStore.getItemAsync(TOKEN_KEY);
export const clearPatientToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

export const GUEST_KEY = "dhic_guest_mode";
export const setGuestMode = (val) =>
  SecureStore.setItemAsync(GUEST_KEY, val ? "1" : "0");
export const getGuestMode = async () =>
  (await SecureStore.getItemAsync(GUEST_KEY)) === "1";

// Active session role — same token slot is reused for patient or receptionist login,
// this flag tells the app which "/me" endpoint & which screens to show.
export const setActiveRole = (role) => SecureStore.setItemAsync(ROLE_KEY, role);
export const getActiveRole = () => SecureStore.getItemAsync(ROLE_KEY);
export const clearActiveRole = () => SecureStore.deleteItemAsync(ROLE_KEY);

export { API_URL };
export default client;