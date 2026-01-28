const nodemailer = require('nodemailer');

// Create transporter with timeout
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

/**
 * Send OTP for password reset
 */
const sendPasswordResetOTP = async (email, otp, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"TruckFlow" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset OTP - TruckFlow',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #facc15; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background: #fff; border: 2px dashed #facc15; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #000; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #000;">TruckFlow</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hi ${name},</p>
              <p>We received a request to reset your password. Use the OTP below to reset your password:</p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #666;">Your OTP Code</p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <p><strong>This OTP will expire in 10 minutes.</strong></p>
              <p>If you didn't request this, please ignore this email.</p>
              
              <p>Best regards,<br>TruckFlow Team</p>
            </div>
            <div class="footer">
              <p>© 2026 TruckFlow. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset OTP sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    throw error;
  }
};

/**
 * Send driver invitation email with setup link
 */
const sendDriverInvitation = async (email, name, token) => {
  try {
    const transporter = createTransporter();
    const setupLink = `${process.env.FRONTEND_URL}/auth/setup-password?token=${token}`;

    const mailOptions = {
      from: `"TruckFlow" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to TruckFlow - Set Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #facc15; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #000;">TruckFlow</h1>
            </div>
            <div class="content">
              <h2>Welcome to TruckFlow!</h2>
              <p>Hi ${name},</p>
              <p>You've been added as a driver to TruckFlow. To get started, please set your password by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${setupLink}" class="button">Set Your Password</a>
              </div>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="background: #fff; padding: 10px; border-radius: 4px; word-break: break-all;">${setupLink}</p>
              
              <p><strong>This link will expire in 24 hours.</strong></p>
              
              <p>Your login email: <strong>${email}</strong></p>
              
              <p>After setting your password, you can sign in to the TruckFlow app and start managing your loads.</p>
              
              <p>Best regards,<br>TruckFlow Team</p>
            </div>
            <div class="footer">
              <p>© 2026 TruckFlow. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Driver invitation sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending driver invitation:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetOTP,
  sendDriverInvitation,
};
