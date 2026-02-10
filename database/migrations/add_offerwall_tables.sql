-- Offerwall System Tables
-- Run this migration to add offerwall support

-- Network configuration table
CREATE TABLE IF NOT EXISTS offerwall_networks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    secret_key VARCHAR(255) NOT NULL,
    payout_percent DECIMAL(5,2) DEFAULT 70.00,
    hash_method ENUM('md5', 'sha256', 'sha1') DEFAULT 'md5',
    ip_whitelist TEXT,
    offerwall_url VARCHAR(1000),
    postback_url VARCHAR(500),
    status ENUM('active', 'inactive', 'testing') DEFAULT 'active',
    total_earnings DECIMAL(12,2) DEFAULT 0.00,
    total_conversions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Transaction log table
CREATE TABLE IF NOT EXISTS offerwall_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    network_id INT NOT NULL,
    network_name VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    offer_id VARCHAR(255),
    offer_name VARCHAR(500),
    payout DECIMAL(10,4) NOT NULL,
    credited_amount DECIMAL(10,4) NOT NULL,
    admin_profit DECIMAL(10,4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    ip_address VARCHAR(45),
    user_agent TEXT,
    raw_data TEXT,
    status ENUM('credited', 'pending', 'rejected', 'duplicate', 'invalid_signature', 'user_not_found') DEFAULT 'pending',
    error_message VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (network_id) REFERENCES offerwall_networks(id) ON DELETE CASCADE,
    
    -- Prevent duplicate transactions per network
    UNIQUE KEY unique_network_transaction (network_id, transaction_id),
    
    -- Indexes for fast lookups
    INDEX idx_user_id (user_id),
    INDEX idx_network_id (network_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Insert default offerwall networks
INSERT INTO offerwall_networks (name, display_name, description, secret_key, payout_percent, hash_method, offerwall_url) VALUES
('adgate', 'AdGate Media', 'Complete surveys, watch videos, and download apps to earn rewards.', 'CHANGE_ME_ADGATE_SECRET', 70.00, 'md5', 'https://wall.adgaterewards.com/{wall_id}/{user_id}'),
('cpx', 'CPX Research', 'Premium surveys with high payouts. Share your opinion and get paid.', 'CHANGE_ME_CPX_SECRET', 70.00, 'md5', 'https://offers.cpx-research.com/index.php?app_id={app_id}&ext_user_id={user_id}'),
('timewall', 'TimeWall', 'Complete timed offers and earn money while you wait.', 'CHANGE_ME_TIMEWALL_SECRET', 70.00, 'sha256', 'https://timewall.io/offers?user_id={user_id}&pub_id={pub_id}'),
('offertoro', 'OfferToro', 'Complete offers, surveys, and tasks to earn rewards instantly.', 'CHANGE_ME_OFFERTORO_SECRET', 70.00, 'md5', 'https://www.offertoro.com/ifr/show/{pub_id}/{user_id}/0'),
('lootably', 'Lootably', 'Discover new apps, games, and offers while earning rewards.', 'CHANGE_ME_LOOTABLY_SECRET', 70.00, 'sha256', 'https://wall.lootably.com/?placementID={placement_id}&sid={user_id}');

-- Add offerwall earnings column to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS offerwall_earnings DECIMAL(12,4) DEFAULT 0.0000;
