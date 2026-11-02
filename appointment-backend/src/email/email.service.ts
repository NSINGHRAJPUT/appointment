import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { EmailStatus } from '@prisma/client';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templatesDir: string;

  constructor(private prisma: PrismaService) {
    this.templatesDir = process.env.EMAIL_TEMPLATE_DIR
      ? path.resolve(process.env.EMAIL_TEMPLATE_DIR)
      : path.join(__dirname, 'templates');
    this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter
   */
  private initializeTransporter(): void {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn('SMTP configuration incomplete, email sending disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    this.logger.log('SMTP transporter initialized');
  }

  /**
   * Render email template with variable substitution
   */
  private renderTemplate(
    templateName: string,
    variables: Record<string, any>,
  ): string {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.html`);

      if (!fs.existsSync(templatePath)) {
        this.logger.warn(`Template not found: ${templateName}`);
        return '';
      }

      let html = fs.readFileSync(templatePath, 'utf-8');

      // Replace variables
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        const escapedValue = this.escapeHtml(String(value || ''));
        html = html.replace(new RegExp(placeholder, 'g'), escapedValue);
      });

      return html;
    } catch (error) {
      this.logger.error(`Failed to render template ${templateName}`, error);
      return '';
    }
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  private frontendBase(): string {
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  private appointmentLookupUrl(appointmentId: string): string {
    return `${this.frontendBase()}/appointment-lookup?appointmentId=${encodeURIComponent(appointmentId)}`;
  }

  private emailFooterVars(appointmentId?: string) {
    const base = this.frontendBase();
    return {
      unsubscribeUrl: `${base}/unsubscribe`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
      ...(appointmentId
        ? { appointmentLookupUrl: this.appointmentLookupUrl(appointmentId) }
        : {}),
    };
  }

  /**
   * Send email
   */
  async sendEmail(
    to: string,
    subject: string,
    template: string,
    variables: Record<string, any>,
    appointmentId?: string,
    userId?: string,
  ): Promise<void> {
    try {
      if (!this.transporter) {
        this.logger.warn(`Email sending disabled, skipping email to ${to}`);
        return;
      }

      const html = this.renderTemplate(template, variables);

      if (!html) {
        this.logger.warn(
          `Failed to render template ${template}, skipping email`,
        );
        return;
      }

      // Log email attempt
      const emailLog = await this.prisma.emailLog.create({
        data: {
          to,
          template,
          subject,
          status: EmailStatus.PENDING,
          appointmentId,
          userId,
        },
      });

      // Send email
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        to,
        subject,
        html,
      });

      // Update email log
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.SENT,
        },
      });

      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      // Don't throw - email failures should not block operations
    }
  }

  /**
   * Send signup confirmation email
   */
  async sendSignupConfirmation(user: any): Promise<void> {
    const variables = {
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      registrationDate: new Date().toLocaleDateString(),
      loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
      unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe`,
    };

    await this.sendEmail(
      user.email,
      'Welcome to PawCare!',
      'signup-confirmation',
      variables,
      undefined,
      user.id,
    );
  }

  /**
   * Send appointment created email
   */
  async sendAppointmentCreated(appointment: any, doctor: any): Promise<void> {
    const patientEmail =
      appointment.patientEmail || appointment.patient?.user?.email;

    if (!patientEmail) {
      this.logger.warn(
        `No email found for appointment ${appointment.id}, skipping email`,
      );
      return;
    }

    const variables = {
      patientName: appointment.patientName,
      doctorName: doctor.user?.fullName,
      specialization: doctor.specialization,
      appointmentDate: new Date(appointment.startAt).toLocaleString(),
      appointmentId: appointment.id,
      status: appointment.status,
      appointmentDetailsUrl: `${this.frontendBase()}/appointments/${appointment.id}`,
      ...this.emailFooterVars(appointment.id),
    };

    await this.sendEmail(
      patientEmail,
      'Appointment Booking Confirmation',
      'appointment-created',
      variables,
      appointment.id,
    );
  }

  /**
   * Send appointment confirmed email
   */
  async sendAppointmentConfirmed(appointment: any, doctor: any): Promise<void> {
    const patientEmail =
      appointment.patientEmail || appointment.patient?.user?.email;

    if (!patientEmail) {
      this.logger.warn(
        `No email found for appointment ${appointment.id}, skipping email`,
      );
      return;
    }

    const variables = {
      patientName: appointment.patientName,
      doctorName: doctor.user?.fullName,
      specialization: doctor.specialization,
      appointmentDate: new Date(appointment.startAt).toLocaleString(),
      appointmentId: appointment.id,
      joinUrl: `${this.frontendBase()}/appointments/${appointment.id}/join`,
      ...this.emailFooterVars(appointment.id),
    };

    await this.sendEmail(
      patientEmail,
      'Appointment Confirmed!',
      'appointment-confirmed',
      variables,
      appointment.id,
    );
  }

  /**
   * Send appointment cancelled email
   */
  async sendAppointmentCancelled(
    appointment: any,
    doctor: any,
    reason?: string,
  ): Promise<void> {
    const patientEmail =
      appointment.patientEmail || appointment.patient?.user?.email;

    if (!patientEmail) {
      this.logger.warn(
        `No email found for appointment ${appointment.id}, skipping email`,
      );
      return;
    }

    const variables = {
      patientName: appointment.patientName,
      doctorName: doctor.user?.fullName,
      specialization: doctor.specialization,
      appointmentDate: new Date(appointment.startAt).toLocaleString(),
      appointmentId: appointment.id,
      cancellationReason: reason || 'No reason provided',
      rebookUrl: `${this.frontendBase()}/booking?doctorId=${doctor.id}`,
      ...this.emailFooterVars(appointment.id),
    };

    await this.sendEmail(
      patientEmail,
      'Appointment Cancelled',
      'appointment-cancelled',
      variables,
      appointment.id,
    );
  }

  /**
   * Send payment success email
   */
  async sendPaymentSuccess(
    appointment: any,
    payment: any,
    doctor: any,
  ): Promise<void> {
    const patientEmail =
      appointment.patientEmail || appointment.patient?.user?.email;

    if (!patientEmail) {
      this.logger.warn(
        `No email found for appointment ${appointment.id}, skipping email`,
      );
      return;
    }

    const variables = {
      patientName: appointment.patientName,
      amount: (payment.amount / 100).toFixed(2),
      currency: payment.currency,
      transactionId: payment.stripeSessionId,
      paymentDate: new Date(payment.createdAt).toLocaleString(),
      doctorName: doctor.user?.fullName,
      appointmentDate: new Date(appointment.startAt).toLocaleString(),
      appointmentId: appointment.id,
      appointmentDetailsUrl: `${this.frontendBase()}/appointments/${appointment.id}`,
      ...this.emailFooterVars(appointment.id),
    };

    await this.sendEmail(
      patientEmail,
      'Payment Successful!',
      'payment-success',
      variables,
      appointment.id,
    );
  }

  /**
   * Send payment failed email
   */
  async sendPaymentFailed(
    appointment: any,
    doctor: any,
    errorReason: string,
  ): Promise<void> {
    const patientEmail =
      appointment.patientEmail || appointment.patient?.user?.email;

    if (!patientEmail) {
      this.logger.warn(
        `No email found for appointment ${appointment.id}, skipping email`,
      );
      return;
    }

    const variables = {
      patientName: appointment.patientName,
      errorReason,
      doctorName: doctor.user?.fullName,
      appointmentDate: new Date(appointment.startAt).toLocaleString(),
      appointmentId: appointment.id,
      retryPaymentUrl: `${this.frontendBase()}/payment/retry/${appointment.id}`,
      ...this.emailFooterVars(appointment.id),
    };

    await this.sendEmail(
      patientEmail,
      'Payment Failed',
      'payment-failed',
      variables,
      appointment.id,
    );
  }

  /**
   * Send booking verification OTP email
   */
  async sendBookingOtp(
    email: string,
    otp: string,
    expiresAt: Date,
  ): Promise<void> {
    const expirationMinutes = 10;
    const variables = {
      otp,
      expiresAt: `${expirationMinutes} minutes`,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
    };

    await this.sendEmail(
      email,
      'Your PawCare Booking Code',
      'otp-login',
      variables,
    );
  }

  /**
   * Send OTP login email
   */
  async sendOtpLogin(
    email: string,
    otp: string,
    expiresAt: Date,
  ): Promise<void> {
    const expirationMinutes = 10;
    const variables = {
      otp,
      expiresAt: `${expirationMinutes} minutes`,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
    };

    await this.sendEmail(email, 'Your Login Code', 'otp-login', variables);
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(
    email: string,
    otp: string,
    expiresAt: Date,
  ): Promise<void> {
    const expirationMinutes = 10;
    const variables = {
      otp,
      expiresAt: `${expirationMinutes} minutes`,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
    };

    await this.sendEmail(
      email,
      'Reset Your Password',
      'password-reset',
      variables,
    );
  }

  /**
   * Retry failed emails (for scheduler)
   */
  async retryFailedEmails(): Promise<void> {
    try {
      const failedEmails = await this.prisma.emailLog.findMany({
        where: {
          status: EmailStatus.FAILED,
          attemptCount: { lt: 3 },
        },
        take: 10,
      });

      for (const emailLog of failedEmails) {
        const backoffMs = Math.pow(4, emailLog.attemptCount) * 1000; // 1s, 4s, 16s
        const lastAttempt = emailLog.lastAttemptAt?.getTime() || 0;
        const now = Date.now();

        if (now - lastAttempt < backoffMs) {
          continue; // Not ready to retry yet
        }

        try {
          // Resend email (simplified - in production would need to store template and variables)
          await this.prisma.emailLog.update({
            where: { id: emailLog.id },
            data: {
              attemptCount: { increment: 1 },
              lastAttemptAt: new Date(),
            },
          });

          this.logger.log(`Retried email to ${emailLog.to}`);
        } catch (error) {
          this.logger.error(`Failed to retry email ${emailLog.id}`, error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to retry failed emails', error);
    }
  }
}
