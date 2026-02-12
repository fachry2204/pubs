-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user', 'operator') DEFAULT 'user',
    status ENUM('pending', 'review', 'accepted', 'rejected') DEFAULT 'pending',
    percentage_share DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Songs Table
CREATE TABLE IF NOT EXISTS songs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    song_id VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    other_title VARCHAR(255),
    authorized_rights VARCHAR(255),
    performer VARCHAR(255),
    duration VARCHAR(20),
    genre VARCHAR(100),
    language VARCHAR(50),
    region VARCHAR(100),
    iswc VARCHAR(50),
    isrc VARCHAR(50),
    note TEXT,
    status ENUM('pending', 'review', 'accepted', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    lyrics_file VARCHAR(255),
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Writers Table
CREATE TABLE IF NOT EXISTS writers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    song_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    share_percent DECIMAL(5,2) DEFAULT 0,
    role VARCHAR(100),
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- Creators Table
CREATE TABLE IF NOT EXISTS creators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nik VARCHAR(50),
    birth_place VARCHAR(100),
    birth_date DATE,
    address TEXT,
    religion VARCHAR(50),
    marital_status VARCHAR(50),
    occupation VARCHAR(100),
    nationality VARCHAR(50),
    ktp_path VARCHAR(255),
    npwp_path VARCHAR(255),
    bank_name VARCHAR(100),
    bank_account_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    song_id INT NULL,
    custom_id VARCHAR(255),
    title VARCHAR(255),
    writer VARCHAR(255),
    source VARCHAR(255),
    gross_revenue DECIMAL(15, 2),
    deduction DECIMAL(15, 2),
    net_revenue DECIMAL(15, 2),
    sub_pub_share DECIMAL(15, 2),
    tbw_share DECIMAL(15, 2),
    month INT,
    year INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE SET NULL
);

-- Import History Table
CREATE TABLE IF NOT EXISTS import_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255),
    month INT,
    year INT,
    period VARCHAR(255),
    total_records INT,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    note TEXT,
    payment_date DATE,
    month INT,
    year INT,
    status ENUM('pending', 'process', 'success') DEFAULT 'pending',
    proof_file VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Writer Payments Table
CREATE TABLE IF NOT EXISTS writer_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    writer_name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    month INT,
    year INT,
    status ENUM('pending', 'process', 'success') DEFAULT 'pending',
    proof_file VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    type VARCHAR(50) DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255),
    logo VARCHAR(255),
    app_icon VARCHAR(255),
    login_background VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default Admin User (Password: admin123)
-- Only insert if not exists (This part is better handled by app logic but good for manual reference)
-- INSERT INTO users (name, email, password, role, status) VALUES ('Admin', 'admin@mail.com', '$2a$10$YourHashedPasswordHere', 'admin', 'accepted');
