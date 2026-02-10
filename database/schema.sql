-- GPT Earning Platform Database Schema
-- MySQL Database

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    pending_balance DECIMAL(10, 2) DEFAULT 0.00,
    total_earned DECIMAL(10, 2) DEFAULT 0.00,
    today_earned DECIMAL(10, 2) DEFAULT 0.00,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    referred_by INT DEFAULT NULL,
    status ENUM('active', 'banned', 'pending') DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255) DEFAULT NULL,
    password_reset_token VARCHAR(255) DEFAULT NULL,
    password_reset_expires DATETIME DEFAULT NULL,
    last_ip VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_referral_code (referral_code),
    INDEX idx_status (status)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_link VARCHAR(500) NOT NULL,
    reward DECIMAL(10, 2) NOT NULL,
    max_completions_per_user INT DEFAULT 5,
    cooldown_hours INT DEFAULT 10,
    task_type ENUM('watch_ads', 'short_links', 'social_tasks', 'offerwalls', 'daily_bonus', 'streak_reward') NOT NULL,
    icon VARCHAR(50) DEFAULT 'task',
    status ENUM('active', 'inactive') DEFAULT 'active',
    total_completions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_task_type (task_type)
);

-- Task completions (tracks how many times each user completed each task)
CREATE TABLE IF NOT EXISTS task_completions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NOT NULL,
    completion_count INT DEFAULT 0,
    last_completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_task (user_id, task_id),
    INDEX idx_user_id (user_id),
    INDEX idx_task_id (task_id)
);

-- Task locks (tracks cooldown periods per user per task)
CREATE TABLE IF NOT EXISTS task_locks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NOT NULL,
    unlock_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_task_lock (user_id, task_id),
    INDEX idx_unlock_at (unlock_at)
);

-- VIP Plans table
CREATE TABLE IF NOT EXISTS vip_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INT NOT NULL,
    earning_bonus DECIMAL(5, 2) DEFAULT 20.00,
    fee_discount DECIMAL(5, 2) DEFAULT 60.00,
    min_withdrawal DECIMAL(10, 2) DEFAULT 5.00,
    priority_payout BOOLEAN DEFAULT TRUE,
    ad_free BOOLEAN DEFAULT TRUE,
    badge_color VARCHAR(20) DEFAULT 'gold',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status)
);

-- User VIP subscriptions
CREATE TABLE IF NOT EXISTS user_vip (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    payment_reference VARCHAR(255),
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES vip_plans(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_status (status)
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    fee DECIMAL(10, 2) NOT NULL,
    net_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('jazzcash', 'easypaisa', 'usdt_trc20', 'binance_pay') NOT NULL,
    payment_details JSON NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'processing', 'completed') DEFAULT 'pending',
    admin_notes TEXT,
    processed_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Payments table (for VIP purchases, etc.)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_type ENUM('vip_subscription', 'other') NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(255),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referrer_id INT NOT NULL,
    referred_id INT NOT NULL,
    commission_rate DECIMAL(5, 2) DEFAULT 10.00,
    total_commission_earned DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_referral (referrer_id, referred_id),
    INDEX idx_referrer_id (referrer_id)
);

-- Earnings logs table
CREATE TABLE IF NOT EXISTS earnings_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    source_type ENUM('task', 'referral', 'bonus', 'promo_code', 'streak', 'daily_bonus') NOT NULL,
    source_id INT DEFAULT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_source_type (source_type),
    INDEX idx_created_at (created_at)
);

-- Login logs table
CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    is_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_created_at (created_at)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id_read (user_id, is_read)
);

-- Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    reward_type ENUM('fixed', 'percentage') NOT NULL,
    reward_value DECIMAL(10, 2) NOT NULL,
    max_uses INT DEFAULT NULL,
    used_count INT DEFAULT 0,
    expires_at DATETIME DEFAULT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_status (status)
);

-- Promo code uses
CREATE TABLE IF NOT EXISTS promo_code_uses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    promo_code_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_promo_user (promo_code_id, user_id)
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO site_settings (setting_key, setting_value, setting_type) VALUES
('daily_earning_limit', '50.00', 'number'),
('referral_commission_rate', '10.00', 'number'),
('withdrawal_fee_standard', '5.00', 'number'),
('min_withdrawal_standard', '10.00', 'number'),
('min_withdrawal_vip', '5.00', 'number'),
('withdrawal_fee_vip', '2.00', 'number'),
('site_name', 'GPT Earn', 'string'),
('site_description', 'Earn money by completing simple tasks', 'string');

-- Insert default VIP plans
INSERT INTO vip_plans (name, description, price, duration_days, earning_bonus, fee_discount, min_withdrawal) VALUES
('VIP Monthly', 'Monthly VIP membership with premium benefits', 9.99, 30, 20.00, 60.00, 5.00),
('VIP Yearly', 'Annual VIP membership - Best Value!', 79.99, 365, 25.00, 70.00, 3.00);

-- Insert sample tasks
INSERT INTO tasks (title, description, task_link, reward, max_completions_per_user, cooldown_hours, task_type, icon) VALUES
('Watch Video Ad', 'Watch a 30-second video advertisement to earn', 'https://example.com/ad', 0.05, 10, 4, 'watch_ads', 'play-circle'),
('Visit Shortlink', 'Visit the link and wait for countdown', 'https://example.com/link', 0.03, 20, 2, 'short_links', 'link'),
('Follow on Twitter', 'Follow our official Twitter account', 'https://twitter.com/example', 0.50, 1, 720, 'social_tasks', 'twitter'),
('Daily Bonus', 'Claim your daily login bonus', 'internal://daily-bonus', 0.10, 1, 24, 'daily_bonus', 'gift'),
('Complete Survey', 'Complete an offerwall survey', 'https://example.com/offerwall', 1.00, 5, 12, 'offerwalls', 'clipboard');

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (email, username, password_hash, role) VALUES
('admin@gpt-earn.com', 'SuperAdmin', '$2a$10$rQnM5Y5K5K5K5K5K5K5K5.5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5', 'super_admin');
