import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create a Nodemailer transporter using SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.EMAIL_PORT || '587', 10) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    },
    connectionTimeout: 5 * 60 * 1000,
});

async function sendMail(to, subject, html) {
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to,
        subject,
        html
    };

    try {
        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

async function sendVerificationEmail(to, token) {
    const subject = 'Verify your email address';
    const html = `
        <p>Click the link below to verify your email address:</p>
        <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}">Verify Email</a>
    `;
    await sendMail(to, subject, html);
}

export {sendMail, sendVerificationEmail};