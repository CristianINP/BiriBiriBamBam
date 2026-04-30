import { Router } from 'express';
import { registerUser, loginUser, getUserById } from '../controllers/usuario.controller.js';

const router = Router();

router.post('/', registerUser);
router.post('/login', loginUser);
router.get('/:id', getUserById);

export default router;