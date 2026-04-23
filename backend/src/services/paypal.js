const express = require('express');
const router = express.Router();
const { createOrder, captureOrder } = require('../controllers/paypal');

router.post('/paypal/create-order', createOrder);
router.post('/paypal/capture-order/:orderID', captureOrder);

module.exports = router;
