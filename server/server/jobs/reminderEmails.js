import cron from 'node-cron';
import prisma from '../config/database.js';
import { sendReminderEmail } from '../utils/email.js';

// Run every day at 9 AM
const reminderJob = cron.schedule('0 9 * * *', async () => {
  console.log('Running reminder email job...');

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find all bookings with check-in tomorrow
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        checkIn: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        status: 'CONFIRMED',
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        hotel: {
          select: {
            name: true,
          },
        },
        room: {
          select: {
            roomType: true,
          },
        },
      },
    });

    console.log(`Found ${upcomingBookings.length} upcoming check-ins`);

    for (const booking of upcomingBookings) {
      try {
        await sendReminderEmail(booking.user.email, {
          userName: `${booking.user.firstName} ${booking.user.lastName}`,
          hotelName: booking.hotel.name,
          roomType: booking.room.roomType,
          checkIn: booking.checkIn.toLocaleDateString(),
          checkOut: booking.checkOut.toLocaleDateString(),
        });
        console.log(`Reminder sent to ${booking.user.email}`);
      } catch (error) {
        console.error(`Failed to send reminder to ${booking.user.email}:`, error);
      }
    }

    console.log('Reminder email job completed');
  } catch (error) {
    console.error('Error in reminder email job:', error);
  }
}, {
  scheduled: false, // Don't start automatically in test environments
});

// Start job only in production or if explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON_JOBS === 'true') {
  reminderJob.start();
  console.log('✅ Reminder email cron job scheduled');
}

export default reminderJob;
