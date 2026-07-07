import { broadcastEvent } from '../socket/socket.service.js';

/**
 * Send SMS notification
 * @param {string} to - recipient phone number
 * @param {string} body - SMS content
 * @returns {Promise<boolean>}
 */
export const sendSMS = async (to, body) => {
  try {
    console.log(`[SMS Notification] Sent to: ${to} | Body: ${body}`);
    // Extend with Twilio SDK here in production
    return true;
  } catch (error) {
    console.error('SMS notification error:', error.message);
    return false;
  }
};

/**
 * Send Email notification
 * @param {string} to - recipient email
 * @param {string} subject - Email subject
 * @param {string} body - Email body content
 * @returns {Promise<boolean>}
 */
export const sendEmail = async (to, subject, body) => {
  try {
    console.log(`[Email Notification] Sent to: ${to} | Subject: ${subject}`);
    // Extend with Nodemailer or SendGrid here in production
    return true;
  } catch (error) {
    console.error('Email notification error:', error.message);
    return false;
  }
};

/**
 * Send real-time System Alert / Push notification
 * @param {string} title
 * @param {string} message
 * @param {string} severity - LOW, MEDIUM, HIGH, CRITICAL
 * @returns {Promise<boolean>}
 */
export const sendPushNotification = async (title, message, severity = 'INFO') => {
  try {
    console.log(`[Push Notification] [${severity}] Title: ${title} | Msg: ${message}`);
    
    // Broadcast via Socket.IO
    broadcastEvent('alertCreated', {
      title,
      message,
      severity,
      timestamp: new Date().toISOString(),
    });
    
    return true;
  } catch (error) {
    console.error('Push notification error:', error.message);
    return false;
  }
};
