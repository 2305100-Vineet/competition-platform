const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendOtpEmail, sendWelcomeEmail } = require('../utils/mailer');

const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role === 'organizer' ? 'organizer' : 'player'
    });

    sendWelcomeEmail(user.email, user.name).catch((err) => console.error('Welcome email failed:', err.message));

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Sends a fresh OTP (also used for "resend"). Always responds with the same
// generic message regardless of whether the email exists, to avoid leaking
// which addresses are registered. Enforces a cooldown between sends per user.
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });

    const genericMessage = 'If that email is registered, a verification code has been sent.';
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.json({ message: genericMessage });
    }

    if (user.otpLastSentAt) {
      const elapsed = Date.now() - user.otpLastSentAt.getTime();
      if (elapsed < OTP_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({ message: `Please wait ${retryAfterSeconds}s before requesting another code`, retryAfterSeconds });
      }
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    user.otpHash = hashOtp(otp);
    user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    user.otpLastSentAt = new Date();
    user.otpAttempts = 0;
    await user.save();

    await sendOtpEmail(user.email, otp);

    res.json({ message: genericMessage, cooldownSeconds: OTP_COOLDOWN_MS / 1000 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'email, otp, and newPassword are required' });
    }

    const invalidMessage = 'That code is invalid or has expired';
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ message: invalidMessage });
    }

    if (user.otpExpiresAt < new Date()) {
      user.otpHash = null;
      user.otpExpiresAt = null;
      await user.save();
      return res.status(400).json({ message: invalidMessage });
    }

    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      user.otpHash = null;
      user.otpExpiresAt = null;
      await user.save();
      return res.status(400).json({ message: 'Too many incorrect attempts. Please request a new code.' });
    }

    if (hashOtp(otp) !== user.otpHash) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ message: invalidMessage });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.otpLastSentAt = null;
    user.otpAttempts = 0;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};