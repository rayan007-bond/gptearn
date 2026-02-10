const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"GPT Earn" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};

const sendVerificationEmail = async (email, token) => {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">GPT Earn</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #1f2937;">Verify Your Email</h2>
                <p style="color: #6b7280;">Thank you for registering! Please click the button below to verify your email address.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verifyUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">Verify Email</a>
                </div>
                <p style="color: #9ca3af; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
            </div>
        </div>
    `;

    return sendEmail(email, 'Verify Your Email - GPT Earn', html);
};

const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">GPT Earn</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #1f2937;">Reset Your Password</h2>
                <p style="color: #6b7280;">We received a request to reset your password. Click the button below to set a new password.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">Reset Password</a>
                </div>
                <p style="color: #9ca3af; font-size: 12px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            </div>
        </div>
    `;

    return sendEmail(email, 'Reset Your Password - GPT Earn', html);
};

const sendWithdrawalNotification = async (email, status, amount) => {
    const statusMessages = {
        pending: 'Your withdrawal request has been received and is pending approval.',
        approved: 'Your withdrawal has been approved and is being processed.',
        rejected: 'Your withdrawal request has been rejected. Please contact support for more information.',
        completed: 'Your withdrawal has been completed successfully!'
    };

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">GPT Earn</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #1f2937;">Withdrawal Update</h2>
                <p style="color: #6b7280;">${statusMessages[status]}</p>
                <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="margin: 0; color: #1f2937;"><strong>Amount:</strong> $${amount.toFixed(2)}</p>
                    <p style="margin: 10px 0 0; color: #1f2937;"><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
                </div>
            </div>
        </div>
    `;

    return sendEmail(email, `Withdrawal ${status.charAt(0).toUpperCase() + status.slice(1)} - GPT Earn`, html);
};

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWithdrawalNotification
};
