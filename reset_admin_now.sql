-- Reset admin user with correct password hash for 'admin123'
-- First, delete existing admin user
DELETE FROM admins WHERE username = 'admin';

-- Insert new admin user with bcrypt hash for 'admin123'
-- Hash generated using bcrypt for password 'admin123'
INSERT INTO admins (username, hashed_password, created_at)
VALUES ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/JbJzYwWbSzg5V6tqO', NOW());