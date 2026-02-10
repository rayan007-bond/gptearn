const crypto = require('crypto');

// Generate unique referral code
const generateReferralCode = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Generate secure random token
const generateToken = (bytes = 32) => {
    return crypto.randomBytes(bytes).toString('hex');
};

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

// Calculate time remaining
const getTimeRemaining = (unlockAt) => {
    const now = new Date();
    const unlock = new Date(unlockAt);
    const diff = unlock - now;

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
        total: diff,
        hours,
        minutes,
        seconds,
        formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    };
};

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Sanitize user input
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
};

// Calculate VIP bonus
const calculateVIPBonus = (baseAmount, bonusPercentage) => {
    return baseAmount * (1 + bonusPercentage / 100);
};

// Get client IP
const getClientIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.ip;
};

module.exports = {
    generateReferralCode,
    generateToken,
    formatCurrency,
    getTimeRemaining,
    isValidEmail,
    sanitizeInput,
    calculateVIPBonus,
    getClientIP
};
