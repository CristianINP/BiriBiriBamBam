import { Router } from 'express';
import { saveRecibo, getRecibosUsuario, getReciboById } from '../controllers/recibos.controller.js';

const router = Router();

router.post('/save', saveRecibo);
router.get('/usuario/:id_usuario', getRecibosUsuario);
router.get('/:id_recibo', getReciboById);

export default router;
