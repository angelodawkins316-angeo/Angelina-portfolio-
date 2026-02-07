-- ============================================
-- ANGELINA DATABASE SCHEMA
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS angelina_db;
USE angelina_db;

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    surname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Contact Information
    whatsapp VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    location VARCHAR(255) NOT NULL,
    
    -- Project Details
    work_type ENUM(
        'graphics', 
        'invitations', 
        'ecommerce', 
        'booking', 
        'advertising', 
        'custom-web', 
        'landing', 
        'other'
    ) NOT NULL,
    
    ranking ENUM(
        'basic', 
        'landing', 
        'advance', 
        'premium', 
        'ecommerce', 
        'enterprise'
    ) NOT NULL,
    
    budget ENUM(
        'under-50k', 
        '50k-100k', 
        '100k-200k', 
        '200k-500k', 
        'above-500k', 
        'flexible'
    ),
    
    timeline ENUM(
        'urgent', 
        '1-2weeks', 
        '2-4weeks', 
        '1-2months', 
        'flexible'
    ),
    
    description TEXT NOT NULL,
    reference TEXT,
    
    -- Additional Services
    maintenance BOOLEAN DEFAULT FALSE,
    hosting BOOLEAN DEFAULT FALSE,
    seo BOOLEAN DEFAULT FALSE,
    
    -- Marketing
    hear_about ENUM(
        'google', 
        'social', 
        'referral', 
        'advertisement', 
        'other'
    ),
    
    -- Status & Admin
    status ENUM(
        'pending', 
        'reviewed', 
        'accepted', 
        'rejected', 
        'in-progress', 
        'completed', 
        'cancelled'
    ) DEFAULT 'pending',
    
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_work_type (work_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_email (email),
    INDEX idx_subscribed_at (subscribed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CONTACT MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'responded') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PROJECTS TABLE (Portfolio)
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM(
        'graphics', 
        'web-development', 
        'ecommerce', 
        'landing-page', 
        'other'
    ) NOT NULL,
    image_url VARCHAR(500),
    project_url VARCHAR(500),
    client_name VARCHAR(255),
    completion_date DATE,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_featured (featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TESTIMONIALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    client_position VARCHAR(255),
    client_company VARCHAR(255),
    testimonial TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    image_url VARCHAR(500),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_is_approved (is_approved),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ADMIN USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BLOG POSTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image VARCHAR(500),
    author_id INT,
    category VARCHAR(100),
    tags VARCHAR(500),
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    views INT DEFAULT 0,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (author_id) REFERENCES admin_users(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    INDEX idx_published_at (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ANALYTICS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_url VARCHAR(500) NOT NULL,
    referrer VARCHAR(500),
    user_agent TEXT,
    ip_address VARCHAR(45),
    session_id VARCHAR(100),
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_page_url (page_url),
    INDEX idx_visit_date (visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample admin user (password: admin123 - should be hashed in production)
INSERT INTO admin_users (username, email, password_hash, full_name, role) VALUES
('admin', 'angelodawkins010@gmail.com', '$2b$10$samplehashhere', 'Angelo Dawkins', 'super_admin');

-- Insert sample projects
INSERT INTO projects (title, description, category, featured, completion_date) VALUES
('Modern E-Commerce Platform', 'Full-featured online store with payment integration', 'ecommerce', TRUE, '2025-12-15'),
('Corporate Landing Page', 'Professional single-page website for consulting firm', 'landing-page', TRUE, '2026-01-20'),
('Brand Identity Design', 'Complete visual identity including logo and materials', 'graphics', FALSE, '2025-11-30');

-- Insert sample testimonials
INSERT INTO testimonials (client_name, client_position, client_company, testimonial, rating, is_approved) VALUES
('John Smith', 'CEO', 'TechStart Inc.', 'Exceptional work! The website exceeded our expectations.', 5, TRUE),
('Sarah Johnson', 'Marketing Director', 'Creative Agency', 'Professional, timely, and excellent communication throughout.', 5, TRUE),
('Michael Brown', 'Owner', 'Local Business', 'Highly recommended for web development projects.', 4, TRUE);

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- View for appointment statistics
CREATE OR REPLACE VIEW appointment_stats AS
SELECT 
    work_type,
    ranking,
    status,
    COUNT(*) as count,
    DATE(created_at) as date
FROM appointments
GROUP BY work_type, ranking, status, DATE(created_at);

-- View for monthly revenue tracking (if pricing data is added)
CREATE OR REPLACE VIEW monthly_summary AS
SELECT 
    YEAR(created_at) as year,
    MONTH(created_at) as month,
    COUNT(*) as total_appointments,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
FROM appointments
GROUP BY YEAR(created_at), MONTH(created_at)
ORDER BY year DESC, month DESC;

-- ============================================
-- STORED PROCEDURES
-- ============================================

DELIMITER //

-- Procedure to get appointment summary
CREATE PROCEDURE GetAppointmentSummary(IN days INT)
BEGIN
    SELECT 
        status,
        COUNT(*) as count
    FROM appointments
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL days DAY)
    GROUP BY status;
END //

-- Procedure to archive old appointments
CREATE PROCEDURE ArchiveOldAppointments(IN months INT)
BEGIN
    UPDATE appointments
    SET status = 'archived'
    WHERE created_at < DATE_SUB(NOW(), INTERVAL months MONTH)
    AND status IN ('completed', 'rejected', 'cancelled');
END //

DELIMITER ;

-- ============================================
-- TRIGGERS
-- ============================================

DELIMITER //

-- Trigger to log appointment status changes
CREATE TRIGGER after_appointment_status_update
AFTER UPDATE ON appointments
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO appointment_status_log (appointment_id, old_status, new_status, changed_at)
        VALUES (NEW.id, OLD.status, NEW.status, NOW());
    END IF;
END //

DELIMITER ;

-- Create status log table for the trigger
CREATE TABLE IF NOT EXISTS appointment_status_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    INDEX idx_appointment_id (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PERFORMANCE OPTIMIZATION
-- ============================================

-- Add composite indexes for common queries
CREATE INDEX idx_appointment_status_date ON appointments(status, created_at);
CREATE INDEX idx_appointment_work_ranking ON appointments(work_type, ranking);

-- ============================================
-- DATABASE COMPLETE
-- ============================================

SELECT 'Database schema created successfully!' as message;
