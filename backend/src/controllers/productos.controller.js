const db = require('../config/db');

const getProductos = (req, res) => {
  const query = 'SELECT * FROM productos';
  db.query(query, (error, resultados) => {
    if (error) {
      console.error('Error fetching productos:', error);
      return res.status(500).json({ error: 'Error al cargar los productos' });
    }
    res.json(resultados);
  });
};

module.exports = {
  getProductos
};