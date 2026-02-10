-- Fix admin password hash (password: admin123)
UPDATE admin_users 
SET password_hash = '$2b$10$Aszqf/HSnWrqWaYLZWGb5uVvCSdY9Vdv.ntT1TIKqcIqzrcUu/iTK' 
WHERE email = 'admin@gpt-earn.com';

-- If no admin exists, insert one
INSERT INTO admin_users (email, username, password_hash, role) 
SELECT 'admin@gpt-earn.com', 'SuperAdmin', '$2b$10$Aszqf/HSnWrqWaYLZWGb5uVvCSdY9Vdv.ntT1TIKqcIqzrcUu/iTK', 'super_admin'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@gpt-earn.com');
