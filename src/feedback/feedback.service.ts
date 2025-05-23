import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class FeedbackService {
  async sendFeedback(feedback: { name: string; email: string; message: string }): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT, 10),
      secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Polling Feedback" <${process.env.MAIL_FROM}>`,
      to: process.env.FEEDBACK_EMAIL,
      subject: `Feedback from ${feedback.name}`,
      text: `You have received feedback from ${feedback.name} (${feedback.email}):\n\n${feedback.message}`,
    };

    await transporter.sendMail(mailOptions);
  }
}