import { createPaypalOrder, capturePaypalOrder } from '../service/paypal.service.js';

export async function createOrder(req, res) {
  try {
    const { items, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'El carrito está vacío'
      });
    }

    if (!total || Number(total) <= 0) {
      return res.status(400).json({
        error: 'El total es inválido'
      });
    }

    const order = await createPaypalOrder({ items, total });

    res.status(200).json({
      id: order.id,
      status: order.status
    });
  } catch (error) {
    console.error('Error en createOrder:', error.message);

    res.status(500).json({
      error: 'No se pudo crear la orden',
      detalle: error.message
    });
  }
}

export async function captureOrder(req, res) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        error: 'orderId es obligatorio'
      });
    }

    const captureData = await capturePaypalOrder(orderId);

    res.status(200).json(captureData);
  } catch (error) {
    console.error('Error en captureOrder:', error.message);

    res.status(500).json({
      error: 'No se pudo capturar la orden',
      detalle: error.message
    });
  }
}
