import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export const sendBookingConfirmation = async (userEmail, bookingDetails) => {
  const html = `
    <h2>Booking Confirmation</h2>
    <p>Dear ${bookingDetails.userName},</p>
    <p>Your booking has been confirmed!</p>
    <h3>Booking Details:</h3>
    <ul>
      <li><strong>Hotel:</strong> ${bookingDetails.hotelName}</li>
      <li><strong>Room:</strong> ${bookingDetails.roomType}</li>
      <li><strong>Check-in:</strong> ${bookingDetails.checkIn}</li>
      <li><strong>Check-out:</strong> ${bookingDetails.checkOut}</li>
      <li><strong>Guests:</strong> ${bookingDetails.guests}</li>
      <li><strong>Total Price:</strong> $${bookingDetails.totalPrice}</li>
    </ul>
    <p>Thank you for choosing our service!</p>
  `;

  await sendEmail({
    to: userEmail,
    subject: 'Booking Confirmation',
    html,
  });
};

export const sendBookingCancellation = async (userEmail, bookingDetails) => {
  const html = `
    <h2>Booking Cancellation</h2>
    <p>Dear ${bookingDetails.userName},</p>
    <p>Your booking has been cancelled.</p>
    <h3>Cancelled Booking Details:</h3>
    <ul>
      <li><strong>Hotel:</strong> ${bookingDetails.hotelName}</li>
      <li><strong>Room:</strong> ${bookingDetails.roomType}</li>
      <li><strong>Check-in:</strong> ${bookingDetails.checkIn}</li>
      <li><strong>Check-out:</strong> ${bookingDetails.checkOut}</li>
    </ul>
    <p>If you have any questions, please contact us.</p>
  `;

  await sendEmail({
    to: userEmail,
    subject: 'Booking Cancellation',
    html,
  });
};

export const sendReminderEmail = async (userEmail, bookingDetails) => {
  const html = `
    <h2>Upcoming Stay Reminder</h2>
    <p>Dear ${bookingDetails.userName},</p>
    <p>This is a friendly reminder about your upcoming stay.</p>
    <h3>Booking Details:</h3>
    <ul>
      <li><strong>Hotel:</strong> ${bookingDetails.hotelName}</li>
      <li><strong>Room:</strong> ${bookingDetails.roomType}</li>
      <li><strong>Check-in:</strong> ${bookingDetails.checkIn}</li>
      <li><strong>Check-out:</strong> ${bookingDetails.checkOut}</li>
    </ul>
    <p>We look forward to welcoming you!</p>
  `;

  await sendEmail({
    to: userEmail,
    subject: 'Upcoming Stay Reminder',
    html,
  });
};
