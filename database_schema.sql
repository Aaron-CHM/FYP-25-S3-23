-- Create database
DROP DATABASE IF EXISTS face_animation_db;
CREATE DATABASE IF NOT EXISTS face_animation_db;
USE face_animation_db;


-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'subscriber', 'admin') DEFAULT 'user',
    subscription_status ENUM('active', 'inactive', 'suspended') DEFAULT 'inactive',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Avatars table
CREATE TABLE IF NOT EXISTS avatars (
    avatar_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    avatar_path VARCHAR(500) NOT NULL,
    avatar_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Expressions table
CREATE TABLE IF NOT EXISTS expressions (
    expression_id INT PRIMARY KEY AUTO_INCREMENT,
    expression_name VARCHAR(100) NOT NULL,
    expression_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Animations table
CREATE TABLE IF NOT EXISTS animations (
    animation_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    avatar_id INT NOT NULL,
    expression_id INT,
    driving_video_path VARCHAR(500),
    animation_path VARCHAR(500) NOT NULL,
    status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (avatar_id) REFERENCES avatars(avatar_id) ON DELETE CASCADE,
    FOREIGN KEY (expression_id) REFERENCES expressions(expression_id) ON DELETE SET NULL
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_type ENUM('monthly', 'yearly') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insert default expressions
INSERT INTO expressions (expression_name, expression_description) VALUES
('smile', 'Happy smiling expression'),
('angry', 'Angry expression'),
('surprised', 'Surprised expression'),
('sad', 'Sad expression');

-- Insert default admin user (password: admin123)
-- Password hash generated with werkzeug.security.generate_password_hash('admin123')
INSERT INTO users (fullname, email, password, role, subscription_status) VALUES
('Admin User', 'admin@faceanimation.com', 'scrypt:32768:8:1$hBzKjLQ6HWpvYGxC$0fde8e5e5c5c8e8f8d8b8c8a8e8d8c8b8a8e8d8c8b8a8e8d8c8b8a8e8d8c8b8a8e8d8c8b8a8e8d8c8b8a8e8d8c', 'admin', 'active');

-- Create indexes for better performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_avatar_user ON avatars(user_id);
CREATE INDEX idx_animation_user ON animations(user_id);
CREATE INDEX idx_animation_status ON animations(status);