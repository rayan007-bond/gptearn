const { pool } = require('../config/database');

// Get user's active VIP subscription
const getUserVIP = async (userId) => {
    const [vip] = await pool.query(
        `SELECT uv.*, vp.name, vp.earning_bonus, vp.fee_discount, vp.min_withdrawal, 
                vp.priority_payout, vp.ad_free, vp.badge_color
         FROM user_vip uv
         JOIN vip_plans vp ON uv.plan_id = vp.id
         WHERE uv.user_id = ? AND uv.status = 'active' AND uv.expires_at > NOW()
         ORDER BY uv.expires_at DESC LIMIT 1`,
        [userId]
    );

    return vip.length > 0 ? vip[0] : null;
};

// Check if user is VIP
const isUserVIP = async (userId) => {
    const vip = await getUserVIP(userId);
    return vip !== null;
};

// Calculate earnings with VIP bonus
const calculateEarningsWithVIP = async (userId, baseAmount) => {
    const vip = await getUserVIP(userId);

    if (!vip) {
        return {
            amount: baseAmount,
            bonus: 0,
            isVIP: false,
            bonusPercentage: 0
        };
    }

    const bonusPercentage = parseFloat(vip.earning_bonus);
    const bonus = baseAmount * (bonusPercentage / 100);

    return {
        amount: baseAmount + bonus,
        bonus,
        isVIP: true,
        bonusPercentage,
        vipName: vip.name
    };
};

// Get withdrawal fee for user
const getWithdrawalFee = async (userId, amount) => {
    const vip = await getUserVIP(userId);

    // Get standard fee from settings
    const [settings] = await pool.query(
        "SELECT setting_value FROM site_settings WHERE setting_key IN ('withdrawal_fee_standard', 'withdrawal_fee_vip')"
    );

    const standardFee = 5.0; // Default 5%
    const vipFee = 2.0; // Default 2%

    const feePercentage = vip ? vipFee : standardFee;
    const fee = amount * (feePercentage / 100);

    return {
        feePercentage,
        fee,
        netAmount: amount - fee,
        isVIP: !!vip
    };
};

// Get minimum withdrawal for user
const getMinWithdrawal = async (userId) => {
    const vip = await getUserVIP(userId);

    const [settings] = await pool.query(
        "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('min_withdrawal_standard', 'min_withdrawal_vip')"
    );

    const settingsMap = {};
    settings.forEach(s => settingsMap[s.setting_key] = parseFloat(s.setting_value));

    return vip
        ? (settingsMap.min_withdrawal_vip || 5.0)
        : (settingsMap.min_withdrawal_standard || 10.0);
};

module.exports = {
    getUserVIP,
    isUserVIP,
    calculateEarningsWithVIP,
    getWithdrawalFee,
    getMinWithdrawal
};
