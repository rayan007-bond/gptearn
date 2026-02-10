-- Site settings table (add to schema)
CREATE TABLE IF NOT EXISTS site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User daily limits table
CREATE TABLE IF NOT EXISTS user_daily_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tasks_completed INT DEFAULT 0,
    offers_completed INT DEFAULT 0,
    cooldown_until DATETIME DEFAULT NULL,
    reset_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, reset_date)
);

-- Insert default settings
INSERT INTO site_settings (setting_key, setting_value) VALUES
    ('daily_task_limit', '6'),
    ('daily_offer_limit', '1'),
    ('cooldown_hours', '12'),
    ('min_withdrawal', '5'),
    ('referral_commission', '10'),
    ('vip_unlimited', 'true')
ON DUPLICATE KEY UPDATE setting_value = setting_value;
