import admin from 'firebase-admin';
import prisma from '../config/database.js';

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (err) {
    console.warn('Firebase Admin SDK not initialised (missing or invalid FIREBASE_SERVICE_ACCOUNT_KEY):', err.message);
  }
}

/**
 * Register or update an FCM token for a user.
 * @param {string} userId
 * @param {string} token
 */
export const registerToken = async (userId, token) => {
  return prisma.fcmToken.upsert({
    where: { userId },
    create: { userId, token },
    update: { token },
  });
};

/**
 * Send a push notification to a user via FCM.
 * Silently no-ops if the user has no registered token or Firebase is not initialised.
 * Cleans up invalid tokens on FCM error.
 * @param {string} userId
 * @param {{ title: string, body: string }} notification
 */
export const sendNotification = async (userId, { title, body }) => {
  try {
    const fcmToken = await prisma.fcmToken.findUnique({ where: { userId } });

    if (!fcmToken) {
      return;
    }

    if (!admin.apps.length) {
      console.warn('Firebase Admin SDK is not initialised — skipping push notification for user:', userId);
      return;
    }

    await admin.messaging().send({
      token: fcmToken.token,
      notification: { title, body },
    });
  } catch (err) {
    console.error('FCM send error for user', userId, ':', err.message);
    // Remove the invalid token so we don't keep retrying with it
    try {
      await prisma.fcmToken.delete({ where: { userId } });
    } catch (deleteErr) {
      console.error('Failed to delete invalid FCM token for user', userId, ':', deleteErr.message);
    }
  }
};

/**
 * Notify a user that their booking has been confirmed.
 * @param {{ userId: string, hotel: { name: string }, checkIn: string|Date }} booking
 */
export const sendBookingConfirmedNotification = async (booking) => {
  await sendNotification(booking.userId, {
    title: 'Booking Confirmed',
    body: `${booking.hotel.name} — Check-in: ${new Date(booking.checkIn).toLocaleDateString()}`,
  });
};

/**
 * Notify a user that their booking has been cancelled.
 * @param {{ userId: string, hotel: { name: string } }} booking
 */
export const sendBookingCancelledNotification = async (booking) => {
  await sendNotification(booking.userId, {
    title: 'Booking Cancelled',
    body: booking.hotel.name,
  });
};

/**
 * Send a check-in reminder notification for a booking due tomorrow.
 * @param {{ userId: string, hotel: { name: string }, checkIn: string|Date }} booking
 */
export const sendReminderNotification = async (booking) => {
  await sendNotification(booking.userId, {
    title: 'Check-in Tomorrow',
    body: `${booking.hotel.name} — Check-in: ${new Date(booking.checkIn).toLocaleDateString()}`,
  });
};

export default {
  registerToken,
  sendNotification,
  sendBookingConfirmedNotification,
  sendBookingCancelledNotification,
  sendReminderNotification,
};
