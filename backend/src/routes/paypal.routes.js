import { Router } from 'express';
import { createOrder, captureOrder, guardarPedido } from '../controllers/paypal.controller.js';

const router = Router();

router.post('/create-order', createOrder);
router.post('/capture-order', captureOrder);
router.post('/guardar-pedido', guardarPedido);

export default router;