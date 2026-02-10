-- Create VIP requests table for manual payment approval
CREATE TABLE IF NOT EXISTS vip_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255),
    screenshot_path VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_id INT,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (plan_id) REFERENCES vip_plans(id),
    FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);

-- Add index for faster queries
CREATE INDEX idx_vip_requests_status ON vip_requests(status);
CREATE INDEX idx_vip_requests_user ON vip_requests(user_id);
