-- Database Schema

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS songs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  song_id VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  other_title VARCHAR(255),
  authorized_rights BOOLEAN DEFAULT FALSE,
  performer VARCHAR(255),
  duration INT, -- in seconds
  genre VARCHAR(100),
  language VARCHAR(50),
  region VARCHAR(50),
  iswc VARCHAR(50),
  isrc VARCHAR(50),
  note TEXT,
  status ENUM('pending', 'processing', 'accepted') DEFAULT 'pending',
  user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS writers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  song_id INT,
  name VARCHAR(255) NOT NULL,
  share_percent DECIMAL(5, 2),
  role VARCHAR(100),
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  song_id INT,
  source VARCHAR(100),
  revenue DECIMAL(15, 2),
  share DECIMAL(5, 2),
  total_revenue DECIMAL(15, 2),
  month INT,
  year INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  -- Note: We link logically to songs via song_id (the custom ID string) or the internal ID. 
  -- The requirement says "Mapping: ID Lagu -> cocokkan dengan songs.song_id".
  -- However, for FK integrity, we usually link to songs.id. 
  -- But if song_id is a string like "SONG-001", we might need to look it up.
  -- For this table, I will use the internal songs.id as FK for better integrity if possible, 
  -- or store the string if the song might not exist yet (unlikely).
  -- Let's stick to strict integrity:
  -- FOREIGN KEY (song_id) REFERENCES songs(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  amount DECIMAL(15, 2),
  note TEXT,
  payment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  file_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255),
  logo VARCHAR(255)
);

-- Seeder for Admin
-- Password: admin123 (hashed)
-- We will handle this in the migration script or manually. 
-- For SQL file, we can insert if not exists.
-- $2b$10$X.x.x... is the hash format. I'll generate a hash for 'admin123'.
-- Hash for 'admin123' (bcrypt cost 10): $2b$10$YourGeneratedHashHere
-- I will use a placeholder or generate one in the migration script.
