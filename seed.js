require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connected to MySQL database!');

  // 1. Create Posts Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      excerpt TEXT,
      content LONGTEXT,
      category VARCHAR(100) DEFAULT 'General',
      author VARCHAR(100) DEFAULT 'Admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Create Users Table (Role-based separation for Phase 3)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('master_admin', 'editor', 'admin') DEFAULT 'editor',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Insert Initial Blog Posts
  await connection.query(`
    INSERT INTO posts (title, slug, excerpt, content, category, author) VALUES
    ('10 Tips for Positive Parenting', '10-tips-positive-parenting', 'Simple strategies to foster an encouraging home environment.', '<p>Positive parenting focuses on teaching good behavior rather than punishing bad behavior...</p>', 'Parenting', 'Admin'),
    ('Healthy Snack Ideas for Toddlers', 'healthy-snack-ideas-toddlers', 'Quick and easy nutritional bites your kids will love.', '<p>Nutrition is vital during early childhood growth...</p>', 'Nutrition', 'Admin')
    ON DUPLICATE KEY UPDATE id=id;
  `);

  // 4. Insert Accounts (Master Admin for Busnurd + Dev Account)
  await connection.query(`
    INSERT INTO users (username, email, password_hash, role) VALUES
    ('busnurd', 'busnurd@example.com', 'placeholder_hash_master', 'master_admin'),
    ('isaac607', 'isaacjonas62@gmail.com', 'placeholder_hash_test', 'editor')
    ON DUPLICATE KEY UPDATE id=id;
  `);

  console.log('Database schema and initial data created successfully!');
  await connection.end();
}

setupDatabase().catch((err) => {
  console.error('Database setup failed:', err);
  process.exit(1);
});
