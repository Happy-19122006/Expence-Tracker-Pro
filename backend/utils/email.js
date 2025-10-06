/**
 * Email Utility for ExpenseTracker Pro
 * Handles sending emails for verification, password reset, etc.
 */

const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Email templates
const emailTemplates = {
    emailVerification: (data) => ({
        subject: 'Verify your ExpenseTracker Pro account',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify your email</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome to ExpenseTracker Pro!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${data.name}!</h2>
                        <p>Thank you for signing up for ExpenseTracker Pro. To complete your registration and start tracking your expenses, please verify your email address.</p>
                        
                        <p>Click the button below to verify your email:</p>
                        
                        <a href="${data.verificationURL}" class="button">Verify Email Address</a>
                        
                        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                        <p><a href="${data.verificationURL}">${data.verificationURL}</a></p>
                        
                        <p>This link will expire in 24 hours for security reasons.</p>
                        
                        <p>If you didn't create an account with ExpenseTracker Pro, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 ExpenseTracker Pro. All rights reserved.</p>
                        <p>This email was sent automatically, please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Welcome to ExpenseTracker Pro!
            
            Hello ${data.name},
            
            Thank you for signing up for ExpenseTracker Pro. To complete your registration and start tracking your expenses, please verify your email address.
            
            Click this link to verify your email: ${data.verificationURL}
            
            This link will expire in 24 hours for security reasons.
            
            If you didn't create an account with ExpenseTracker Pro, please ignore this email.
            
            © 2024 ExpenseTracker Pro. All rights reserved.
        `
    }),

    passwordReset: (data) => ({
        subject: 'Reset your ExpenseTracker Pro password',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset your password</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ef4444, #f87171); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                    .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${data.name}!</h2>
                        <p>We received a request to reset your password for your ExpenseTracker Pro account.</p>
                        
                        <p>Click the button below to reset your password:</p>
                        
                        <a href="${data.resetURL}" class="button">Reset Password</a>
                        
                        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                        <p><a href="${data.resetURL}">${data.resetURL}</a></p>
                        
                        <div class="warning">
                            <p><strong>⚠️ Important:</strong> This link will expire in 10 minutes for security reasons.</p>
                        </div>
                        
                        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                        
                        <p>For security reasons, we recommend using a strong password with a mix of letters, numbers, and symbols.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 ExpenseTracker Pro. All rights reserved.</p>
                        <p>This email was sent automatically, please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Password Reset Request
            
            Hello ${data.name},
            
            We received a request to reset your password for your ExpenseTracker Pro account.
            
            Click this link to reset your password: ${data.resetURL}
            
            This link will expire in 10 minutes for security reasons.
            
            If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            
            © 2024 ExpenseTracker Pro. All rights reserved.
        `
    }),

    welcome: (data) => ({
        subject: 'Welcome to ExpenseTracker Pro!',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to ExpenseTracker Pro</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #10b981, #22c55e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                    .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #10b981; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome to ExpenseTracker Pro!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${data.name}!</h2>
                        <p>Congratulations! Your account has been successfully created and verified. You're now ready to start tracking your expenses like a pro!</p>
                        
                        <div class="feature">
                            <h3>📊 Dashboard Overview</h3>
                            <p>View your financial summary, recent transactions, and quick insights at a glance.</p>
                        </div>
                        
                        <div class="feature">
                            <h3>💰 Smart Transaction Management</h3>
                            <p>Add income and expenses with categories, tags, and detailed descriptions.</p>
                        </div>
                        
                        <div class="feature">
                            <h3>📈 Advanced Analytics</h3>
                            <p>Track spending patterns, generate reports, and export data in PDF/CSV format.</p>
                        </div>
                        
                        <div class="feature">
                            <h3>🎤 Voice Assistant</h3>
                            <p>Use voice commands to add transactions, switch tabs, and generate reports hands-free.</p>
                        </div>
                        
                        <a href="${data.dashboardURL}" class="button">Start Tracking Expenses</a>
                        
                        <p>Need help getting started? Check out our user guide or contact our support team.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 ExpenseTracker Pro. All rights reserved.</p>
                        <p>This email was sent automatically, please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Welcome to ExpenseTracker Pro!
            
            Hello ${data.name},
            
            Congratulations! Your account has been successfully created and verified. You're now ready to start tracking your expenses like a pro!
            
            Features available:
            - Dashboard Overview
            - Smart Transaction Management
            - Advanced Analytics
            - Voice Assistant
            
            Start tracking: ${data.dashboardURL}
            
            Need help getting started? Check out our user guide or contact our support team.
            
            © 2024 ExpenseTracker Pro. All rights reserved.
        `
    })
};

// Send email function
const sendEmail = async (options) => {
    try {
        // Create transporter
        const transporter = createTransporter();
        
        // Get email template
        const template = emailTemplates[options.template];
        if (!template) {
            throw new Error(`Email template '${options.template}' not found`);
        }
        
        // Generate email content
        const emailContent = template(options.data);
        
        // Define mail options
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: options.email,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html
        };
        
        // Send email
        const info = await transporter.sendMail(mailOptions);
        
        console.log('Email sent successfully:', info.messageId);
        return info;
        
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};

// Test email configuration
const testEmailConfig = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ Email configuration is valid');
        return true;
    } catch (error) {
        console.error('❌ Email configuration error:', error);
        return false;
    }
};

module.exports = {
    sendEmail,
    testEmailConfig,
    emailTemplates
};
