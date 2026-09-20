const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Each OTP email gets a unique Message-ID and a subject that varies slightly
// (a short reference code) so Gmail treats every request as a fresh message
// instead of folding repeated requests into one collapsed thread.
async function sendOtpEmail(toEmail, otp) {
  const refCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  await transporter.sendMail({
    from: `"CompetitionHub" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your CompetitionHub verification code — ref ${refCode}`,
    messageId: `<otp-${Date.now()}-${refCode}@competitionhub>`,
    html: `
      <p>Your CompetitionHub verification code is:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
      <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
    `
  });
}

async function sendWelcomeEmail(toEmail, name) {
  await transporter.sendMail({
    from: `"CompetitionHub" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Welcome to CompetitionHub',
    html: `<p>Hi ${name}, welcome to CompetitionHub! Create a team or explore tournaments to get started.</p>`
  });
}

module.exports = { sendOtpEmail, sendWelcomeEmail };