require('dotenv').config();
const mysql = require('mysql2/promise');

async function seedDatabase() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'defaultdb',
      port: Number(process.env.DB_PORT) || 3306,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('Creating posts table...');
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
      )
    `);

    console.log('Creating users table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('master_admin', 'editor', 'admin') DEFAULT 'editor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Inserting initial blog posts...');
    const samplePosts = [
      ['10 Tips for Positive Parenting', '10-tips-positive-parenting', 'Simple strategies to foster an encouraging home environment.', '<p>Positive parenting focuses on teaching good behavior rather than punishing bad behavior...</p>', 'Parenting', 'Admin'],
      ['Healthy Snack Ideas for Toddlers', 'healthy-snack-ideas-toddlers', 'Quick and easy nutritional bites your kids will love.', '<p>Nutrition is vital during early childhood growth...</p>', 'Nutrition', 'Admin']
    ];

    for (const post of samplePosts) {
      await connection.query(
        `INSERT INTO posts (title, slug, excerpt, content, category, author) 
         VALUES (?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE id=id`,
        post
      );
    }

    console.log('Inserting user accounts...');
    await connection.query(
      `INSERT INTO users (username, email, password_hash, role) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE id=id`,
      ['busnurd', 'busnurd@example.com', 'placeholder_hash_master', 'master_admin']
    );

    await connection.query(
      `INSERT INTO users (username, email, password_hash, role) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE id=id`,
      ['isaac607', 'isaacjonas62@gmail.com', 'placeholder_hash_test', 'editor']
    );

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    if (connection) await connection.end();
  }
}

seedDatabase();
