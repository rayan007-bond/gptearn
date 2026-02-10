const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const [users] = await pool.query(
            'SELECT id, email, username, balance, pending_balance, total_earned, status, email_verified FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = users[0];

        if (user.status === 'banned') {
            return res.status(403).json({ error: 'Account has been banned' });
        }

        if (user.status === 'pending' && !user.email_verified) {
            return res.status(403).json({ error: 'Please verify your email' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [users] = await pool.query(
            'SELECT id, email, username, balance, status FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length > 0 && users[0].status !== 'banned') {
            req.user = users[0];
        }

        next();
    } catch (error) {
        next();
    }
};

module.exports = { authMiddleware, optionalAuth };
