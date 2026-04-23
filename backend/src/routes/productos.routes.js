import { Router } from 'express';
import { getProductos } from '../controllers/productos.controller.js';

const router = Router();

router.get('/productos', getProductos);

export default router;
