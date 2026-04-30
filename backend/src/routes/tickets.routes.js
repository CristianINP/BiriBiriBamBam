import { Router } from 'express';
import {
  createTicket,
  getTicket,
  getTicketByOrder,
  getTicketsByUser,
  getTicketWithDetails,
  getUserPurchaseReport
} from '../controllers/ticket.controller.js';

const router = Router();

router.post('/', createTicket);
router.get('/order/:orderId', getTicketByOrder);
router.get('/usuario/:userId', getTicketsByUser);
router.get('/reporte/:userId', getUserPurchaseReport);
router.get('/detalle/:id', getTicketWithDetails);
router.get('/:id', getTicket);

export default router;