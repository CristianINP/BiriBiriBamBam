import express from 'express';
import cors from 'cors';
import ProductosRoutes from './routes/productos.routes.js';
import PaypalRoutes from './routes/paypal.routes.js';
import UsuariosRoutes from './routes/usuarios.routes.js';
import TicketsRoutes from './routes/tickets.routes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', ProductosRoutes);
app.use('/api/paypal', PaypalRoutes);
app.use('/api/usuarios', UsuariosRoutes);
app.use('/api/tickets', TicketsRoutes);

export default app;
