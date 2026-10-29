import axios from 'axios';
import Cookies from 'js-cookie';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.drneerajkumarneurologist.com/api/admin',
  timeout: 20000
});

client.interceptors.request.use((config) => {
  const token = Cookies.get('dhic_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('dhic_admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const setAdminToken = (token) => Cookies.set('dhic_admin_token', token, { expires: 7 });
export const getAdminToken = () => Cookies.get('dhic_admin_token');
export const clearAdminToken = () => Cookies.remove('dhic_admin_token');

export default client;
