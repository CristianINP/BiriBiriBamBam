import mysql from 'mysql2';
import 'dotenv/config';

const conexion = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

conexion.connect((error) => {
  if (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    return;
  }
  console.log('✅ Conectado a la base de datos MySQL');
});

export default conexion;