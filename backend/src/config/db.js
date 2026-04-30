import mysql from 'mysql2';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((error, connection) => {
  if (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    return;
  }
  console.log('Connected to MySQL database');
  connection.release();
});

export default pool;
