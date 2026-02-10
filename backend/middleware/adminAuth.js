const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Admin authentication required' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const [admins] = await pool.query(
            'SELECT id, email, username, role, status FROM admin_users WHERE id = ?',
            [decoded.adminId]
        );

        if (admins.length === 0) {
            return res.status(401).json({ error: 'Admin not found' });
        }

        if (admins[0].status !== 'active') {
            return res.status(403).json({ error: 'Admin account is inactive' });
        }

        req.admin = admins[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired admin token' });
        }
        console.error('Admin auth error:', error);
        res.status(500).json({ error: 'Admin authentication failed' });
    }
};

const superAdminOnly = (req, res, next) => {
    if (req.admin.role !== 'super_admin') {
        return res.status(403).json({ error: 'Super admin access required' });
    }
    next();
};

module.exports = { adminAuth, superAdminOnly };
