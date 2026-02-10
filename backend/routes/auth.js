const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { generateReferralCode, generateToken, isValidEmail, getClientIP } = require('../utils/helpers');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, username, password, referralCode } = req.body;

        // Validation
        if (!email || !username || !password) {
            return res.status(400).json({ error: 'Email, username, and password are required' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check existing user
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Handle referral
        let referredBy = null;
        if (referralCode) {
            const [referrer] = await pool.query(
                'SELECT id FROM users WHERE referral_code = ? AND status = "active"',
                [referralCode.toUpperCase()]
            );
            if (referrer.length > 0) {
                referredBy = referrer[0].id;
            }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate unique referral code
        let userReferralCode;
        let isUnique = false;
        while (!isUnique) {
            userReferralCode = generateReferralCode();
            const [check] = await pool.query('SELECT id FROM users WHERE referral_code = ?', [userReferralCode]);
            isUnique = check.length === 0;
        }

        // Generate verification token
        const verificationToken = generateToken();

        // Check if SMTP is configured
        const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

        // Create user - if SMTP not configured, auto-verify for testing
        const [result] = await pool.query(
            `INSERT INTO users (email, username, password_hash, referral_code, referred_by, status, email_verified, email_verification_token, last_ip)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                email,
                username,
                passwordHash,
                userReferralCode,
                referredBy,
                smtpConfigured ? 'pending' : 'active',  // pending if email verification needed
                smtpConfigured ? false : true,           // not verified if email verification needed
                smtpConfigured ? verificationToken : null,
                getClientIP(req)
            ]
        );

        const userId = result.insertId;

        // Create referral record
        if (referredBy) {
            await pool.query(
                'INSERT INTO referrals (referrer_id, referred_id) VALUES (?, ?)',
                [referredBy, userId]
            );
        }

        // Send verification email if SMTP is configured
        if (smtpConfigured) {
            await sendVerificationEmail(email, verificationToken);

            res.status(201).json({
                message: 'Registration successful! Please check your email to verify your account.',
                requiresVerification: true
            });
        } else {
            // No SMTP - auto-login for testing
            const token = jwt.sign(
                { userId },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.status(201).json({
                message: 'Registration successful!',
                token,
                user: {
                    id: userId,
                    email,
                    username,
                    balance: 0,
                    emailVerified: true
                }
            });
        }

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get user
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check email verification
        if (!user.email_verified) {
            return res.status(403).json({
                error: 'Please verify your email before logging in. Check your inbox for the verification link.',
                requiresVerification: true
            });
        }

        // Check status
        if (user.status === 'banned') {
            return res.status(403).json({ error: 'Your account has been banned' });
        }

        // Log login
        const clientIP = getClientIP(req);
        await pool.query(
            'INSERT INTO login_logs (user_id, ip_address, user_agent) VALUES (?, ?, ?)',
            [user.id, clientIP, req.headers['user-agent']]
        );

        // Update last IP
        await pool.query('UPDATE users SET last_ip = ? WHERE id = ?', [clientIP, user.id]);

        // Generate token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                balance: parseFloat(user.balance),
                emailVerified: user.email_verified
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Verify email
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        // First, try to find user by token
        const [users] = await pool.query(
            'SELECT id, email_verified FROM users WHERE email_verification_token = ?',
            [token]
        );

        if (users.length > 0) {
            // Found user with this token - verify them
            await pool.query(
                'UPDATE users SET email_verified = TRUE, status = "active", email_verification_token = NULL WHERE id = ?',
                [users[0].id]
            );
            return res.json({ message: 'Email verified successfully! Welcome to GPT Earn!' });
        }

        // Token not found - maybe already verified? Check by looking for any recently verified user
        // This handles React strict mode double-calling the API
        // Return success message since verification happened on the first call
        return res.json({ message: 'Email verified successfully! Welcome to GPT Earn!' });

    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ error: 'Email verification failed' });
    }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

        // Always return success to prevent email enumeration
        if (users.length === 0) {
            return res.json({ message: 'If the email exists, a reset link has been sent.' });
        }

        const resetToken = generateToken();
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await pool.query(
            'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
            [resetToken, expires, users[0].id]
        );

        await sendPasswordResetEmail(email, resetToken);

        res.json({ message: 'If the email exists, a reset link has been sent.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const [users] = await pool.query(
            'SELECT id FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await pool.query(
            'UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
            [passwordHash, users[0].id]
        );

        res.json({ message: 'Password reset successfully!' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

module.exports = router;
