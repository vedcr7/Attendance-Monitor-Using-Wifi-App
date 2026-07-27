/**
 * config.js — Central configuration.
 * In production, load these from environment variables.
 */
module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'wifi_track_secret_change_in_production',
  JWT_EXPIRES_IN: '24h',
  OTP_EXPIRY_MINUTES: 5,
  OTP_MAX_ATTEMPTS: 3,
};
