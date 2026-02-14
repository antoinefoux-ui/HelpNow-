import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Check if SendGrid API key is available
    if (process.env.SENDGRID_API_KEY) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    } else if (process.env.SMTP_HOST) {
      // Fallback to custom SMTP
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      console.warn('Email service not configured - emails will not be sent');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email transporter not initialized');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `${process.env.SENDGRID_FROM_NAME || 'HelpNow'} <${
          process.env.SENDGRID_FROM_EMAIL || 'noreply@helpnow.com'
        }>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Welcome to HelpNow';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #E53E3E;">Welcome to HelpNow, ${name}!</h1>
        <p>Thank you for joining our community of helpers and seekers.</p>
        <p>HelpNow connects people in emergencies with nearby trained helpers while waiting for professional emergency services.</p>
        <h2>What's Next?</h2>
        <ul>
          <li>Complete your profile</li>
          <li>Add emergency contacts</li>
          <li>Set up your medical information</li>
          <li>Consider becoming a verified helper</li>
        </ul>
        <p>Remember: Always call 112/911 first in case of emergency!</p>
        <p style="color: #666; font-size: 12px;">
          If you have any questions, contact us at support@helpnow.com
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const subject = 'Verify Your Email Address';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #E53E3E;">Verify Your Email</h1>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: #E53E3E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #666; font-size: 12px;">
          This link will expire in 24 hours. If you didn't create an account, please ignore this email.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const subject = 'Reset Your Password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #E53E3E;">Reset Your Password</h1>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #E53E3E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p style="color: #666; font-size: 12px;">
          This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send helper verification success email
   */
  async sendHelperVerificationEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Helper Profile Verified';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10B981;">✅ Congratulations, ${name}!</h1>
        <p>Your helper profile has been verified. You can now start helping people in emergencies.</p>
        <h2>Next Steps:</h2>
        <ul>
          <li>Go online in the Helper Mode to receive emergency alerts</li>
          <li>Set your response radius</li>
          <li>Review your certifications and ensure they're up to date</li>
        </ul>
        <p><strong>Remember:</strong></p>
        <ul>
          <li>Only accept requests you're qualified to handle</li>
          <li>Ensure your own safety first</li>
          <li>Professional emergency services should always be called first</li>
        </ul>
        <p>Thank you for being part of our life-saving community!</p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send emergency resolved email
   */
  async sendEmergencyResolvedEmail(
    to: string,
    emergencyType: string,
    helperName: string
  ): Promise<boolean> {
    const subject = 'Emergency Resolved';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10B981;">Emergency Resolved</h1>
        <p>Your emergency request (${emergencyType.replace('_', ' ')}) has been marked as resolved.</p>
        <p>Helper: ${helperName}</p>
        <p>We hope you're safe now. If you have any feedback about your experience, please let us know.</p>
        <p style="color: #666; font-size: 12px;">
          For any concerns, contact support@helpnow.com
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send monthly summary email
   */
  async sendMonthlySummary(
    to: string,
    stats: {
      totalHelps: number;
      rating: number;
      responseTime: number;
    }
  ): Promise<boolean> {
    const subject = 'Your Monthly HelpNow Summary';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #E53E3E;">Your Monthly Impact</h1>
        <p>Here's a summary of your activity this month:</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">📊 Your Stats</h2>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;">🤝 Total Helps: <strong>${stats.totalHelps}</strong></li>
            <li style="margin: 10px 0;">⭐ Rating: <strong>${stats.rating.toFixed(1)}/5.0</strong></li>
            <li style="margin: 10px 0;">⚡ Avg Response: <strong>${Math.floor(stats.responseTime / 60)} minutes</strong></li>
          </ul>
        </div>
        <p>Thank you for being a valued member of the HelpNow community!</p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }
}

export const emailService = new EmailService();
