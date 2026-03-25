const express = require('express');
const cors = require('cors');
const ProductosRoutes = require('./routes/productos.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', ProductosRoutes);

module.exports = app;