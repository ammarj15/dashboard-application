const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController')

router.post('/', orderController.createOrder);

router.get('/', orderController.getOrders);

router.put('/:id/cancel', orderController.cancelOrder);

router.post('/:id/payment', orderController.confirmPayment);

router.post('/:id/refund', orderController.refundOrder);

module.exports = router;