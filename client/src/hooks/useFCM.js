import { useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging } from '../config/firebase';
import api from '../services/api';

const useFCM = () => {
  useEffect(() => {
    let cancelled = false;

    const registerFCMToken = async () => {
      try {
        if (!messaging) return;
        if (!('Notification' in window)) return;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) return;

        const token = await getToken(messaging, { vapidKey });
        if (!token || cancelled) return;

        await api.post('/notifications/register-token', { token });
      } catch (err) {
        console.warn('FCM token registration failed:', err.message);
      }
    };

    registerFCMToken();

    return () => { cancelled = true; };
  }, []);
};

export default useFCM;
