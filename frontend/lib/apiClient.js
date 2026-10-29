'use client';

import axios from 'axios';
import Cookies from 'js-cookie';

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.drneerajkumarneurologist.com/api'
});

client.interceptors.request.use((config) => {
  const token = Cookies.get('neurocare_patient_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const setPatientToken = (token) => Cookies.set('neurocare_patient_token', token, { expires: 30 });
export const getPatientToken = () => Cookies.get('neurocare_patient_token');
export const clearPatientToken = () => Cookies.remove('neurocare_patient_token');

export default client;
