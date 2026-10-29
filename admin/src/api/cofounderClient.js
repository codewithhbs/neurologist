import axios from 'axios';

// Cofounder API is a separate base path (/api/cofounder) protected only by
// a static secret key header — no login, no JWT.
const adminBase = import.meta.env.VITE_API_URL || 'https://api.drneerajkumarneurologist.com/api/admin';
const baseURL = adminBase.replace(/\/admin\/?$/, '') + '/cofounder';

const cofounderClient = axios.create({ baseURL, timeout: 20000 });

const KEY_STORAGE = 'cofounder_key';

export const getCofounderKey = () => localStorage.getItem(KEY_STORAGE) || 'ffac91a027c9ea9ba08c80cb2b33ce42d1dff4dfadcde7eb7df560243c9c6562';
export const setCofounderKey = (key) => localStorage.setItem(KEY_STORAGE, key);
export const clearCofounderKey = () => localStorage.removeItem(KEY_STORAGE);

cofounderClient.interceptors.request.use((config) => {
  const key = getCofounderKey();
  if (key) config.headers['x-cofounder-key'] = key;
  return config;
});

export default cofounderClient;
