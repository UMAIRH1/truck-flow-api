const nodemailer = require('nodemailer');

// Create transporter with timeout
const createTransporter = async () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
  return transporter;
};

/**
 * Send OTP for password reset
 */
const sendPasswordResetOTP = async (email, otp, name) => {
  try {
    const transporter = await createTransporter();

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
    const transporter = await createTransporter();
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

/**
 * Send email notification for load-related events
 */
const sendLoadNotificationEmail = async (user, load, context) => {
  try {
    const transporter = await createTransporter();
    const loadNum = load.loadNumber || load._id.toString().slice(-8).toUpperCase();
    
    // Determine subject and title based on context
    let subject = '';
    let title = '';
    let intro = '';
    
    switch(context) {
      case 'assigned':
        subject = `New Load Assigned: #${loadNum}`;
        title = 'New Load Assigned';
        intro = `You have been assigned a new load: <strong>#${loadNum}</strong>.`;
        break;
      case 'accepted':
        subject = `Load Accepted: #${loadNum}`;
        title = 'Load Accepted';
        intro = `Driver <strong>${user.name}</strong> has accepted load <strong>#${loadNum}</strong>.`;
        break;
      case 'rejected':
        subject = `Load Rejected: #${loadNum}`;
        title = 'Load Rejected';
        intro = `Driver <strong>${user.name}</strong> has rejected load <strong>#${loadNum}</strong>.`;
        break;
      case 'completed':
        subject = `Load Completed: #${loadNum}`;
        title = 'Load Completed';
        intro = `Driver <strong>${user.name}</strong> has successfully completed load <strong>#${loadNum}</strong>.`;
        break;
      case 'documents_uploaded':
        subject = `Documents Uploaded: #${loadNum}`;
        title = 'Documents Uploaded';
        intro = `Driver <strong>${user.name}</strong> has uploaded new documents for load <strong>#${loadNum}</strong>.`;
        break;
      default:
        subject = `Load Update: #${loadNum}`;
        title = 'Load Update';
        intro = `There is an update for load <strong>#${loadNum}</strong>.`;
    }

    const mailOptions = {
      from: `"TruckFlow" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `${subject} - TruckFlow`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #facc15; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .details-box { background: #fff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { text-align: right; }
            .button { display: inline-block; background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #000;">TruckFlow</h1>
            </div>
            <div class="content">
              <h2>${title}</h2>
              <p>Hi ${user.name},</p>
              <p>${intro}</p>
              
              <div class="details-box">
                <div class="detail-row">
                  <span class="detail-label">Load Number:</span>
                  <span class="detail-value">#${loadNum}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Pickup:</span>
                  <span class="detail-value">${load.pickupLocation}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Dropoff:</span>
                  <span class="detail-value">${load.dropoffLocation}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date(load.loadingDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${load.loadingTime}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Weight:</span>
                  <span class="detail-value">${load.loadWeight} kg</span>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/load/${load._id}" class="button">View Load Details</a>
              </div>
              
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
    console.log(`Load email (${context}) sent to:`, user.email);
    return true;
  } catch (error) {
    console.error(`Error sending load email (${context}):`, error);
    return false;
  }
};

/**
 * Send email notification for route-related events
 */
const sendRouteNotificationEmail = async (driver, route) => {
  try {
    const transporter = await createTransporter();
    const routeNum = route.routeNumber || `R-${route._id.toString().slice(-8).toUpperCase()}`;

    const mailOptions = {
      from: `"TruckFlow" <${process.env.SMTP_USER}>`,
      to: driver.email,
      subject: `New Route Assigned: ${route.routeName} - TruckFlow`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #facc15; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .details-box { background: #fff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { text-align: right; }
            .button { display: inline-block; background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #000;">TruckFlow</h1>
            </div>
            <div class="content">
              <h2>New Route Assigned</h2>
              <p>Hi ${driver.name},</p>
              <p>You have been assigned to a new route: <strong>${route.routeName}</strong>.</p>
              
              <div class="details-box">
                <div class="detail-row">
                  <span class="detail-label">Route:</span>
                  <span class="detail-value">${route.routeName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">ID:</span>
                  <span class="detail-value">${routeNum}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Start Date:</span>
                  <span class="detail-value">${new Date(route.startDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Loads:</span>
                  <span class="detail-value">${route.loads ? route.loads.length : 0}</span>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/routes" class="button">View My Routes</a>
              </div>
              
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
    console.log('Route assignment email sent to:', driver.email);
    return true;
  } catch (error) {
    console.error('Error sending route assignment email:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetOTP,
  sendDriverInvitation,
  sendLoadNotificationEmail,
  sendRouteNotificationEmail,
};
