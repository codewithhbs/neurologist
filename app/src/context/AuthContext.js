import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import client, {
  getPatientToken, setPatientToken, clearPatientToken, getGuestMode, setGuestMode,
  getActiveRole, setActiveRole, clearActiveRole
} from '../api/client';

const AuthContext = createContext(null);
const ONBOARDING_KEY = 'onboarding_seen';

export function AuthProvider({ children }) {
  const [patient, setPatient] = useState(null);
  const [staff, setStaff] = useState(null); // receptionist profile
  const [isGuest, setIsGuest] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null); // null = unknown/loading
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    const seen = await SecureStore.getItemAsync(ONBOARDING_KEY);
    setHasSeenOnboarding(seen === '1');

    const guest = await getGuestMode();
    setIsGuest(guest);

    const token = await getPatientToken();
    const role = await getActiveRole();

    if (token && role === 'receptionist') {
      try {
        const res = await client.get('/reception/auth/me');
        setStaff(res.data.receptionist);
        setIsGuest(false);
      } catch (e) {
        await clearPatientToken();
        await clearActiveRole();
      }
    } else if (token) {
      try {
        const res = await client.get('/auth/me');
        setPatient(res.data.patient);
        setIsGuest(false);
      } catch (e) {
        await clearPatientToken();
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  const completeOnboarding = async () => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, '1');
    setHasSeenOnboarding(true);
  };

  const continueAsGuest = async () => {
    await setGuestMode(true);
    setIsGuest(true);

  };

  const loginWithOtp = async (mobile, otp, name) => {
    const res = await client.post('/auth/verify-otp', { mobile, otp, name });
    await setPatientToken(res.data.token);
    await setActiveRole('patient');
    await setGuestMode(false);
    setPatient(res.data.patient);
    setIsGuest(false);
    return res.data.patient;
  };

  const loginReceptionist = async (mobile, otp) => {
    const res = await client.post('/reception/auth/verify-otp', { mobile, otp });
    await setPatientToken(res.data.token);
    await setActiveRole('receptionist');
    await setGuestMode(false);
    setStaff(res.data.receptionist);
    setIsGuest(false);
    return res.data.receptionist;
  };

  const logout = async () => {
    await clearPatientToken();
    await clearActiveRole();
    await setGuestMode(false);
    setPatient(null);
    setStaff(null);
    setIsGuest(false);
  };

  const isAuthenticated = !!patient;
  const isReceptionist = !!staff;

  return (
    <AuthContext.Provider value={{
      patient, staff, isGuest, isAuthenticated, isReceptionist, loading, hasSeenOnboarding,
      completeOnboarding, continueAsGuest, loginWithOtp, loginReceptionist, logout, setPatient
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);