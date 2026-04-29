import { createPaypalOrder, capturePaypalOrder } from '../service/paypal.service.js';
import db from '../config/db.js';

export async function createOrder(req, res) {
  try {
    const { items, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    if (!total || Number(total) <= 0) {
      return res.status(400).json({ error: 'El total es inválido' });
    }

    const order = await createPaypalOrder({ items, total });

    res.status(200).json({ id: order.id, status: order.status });
  } catch (error) {
    console.error('Error en createOrder:', error.message);
    res.status(500).json({ error: 'No se pudo crear la orden', detalle: error.message });
  }
}

export async function captureOrder(req, res) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId es obligatorio' });
    }

    const captureData = await capturePaypalOrder(orderId);
    res.status(200).json(captureData);
  } catch (error) {
    console.error('Error en captureOrder:', error.message);
    res.status(500).json({ error: 'No se pudo capturar la orden', detalle: error.message });
  }
}

export async function guardarPedido(req, res) {
  const { folio, paypalOrderId, paypalEstado, subtotal, iva, total, items } = req.body;

  // Validaciones básicas
  if (!folio || !paypalOrderId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Datos incompletos para guardar el pedido' });
  }

  const conn = db.promise ? db : null;

  try {
    // Usar promesas con mysql2
    const [result] = await db.promise().query(
      `INSERT INTO pedidos (folio, paypal_orden_id, paypal_estado, subtotal, iva, total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        folio,
        paypalOrderId,
        paypalEstado || 'COMPLETED',
        Number(subtotal).toFixed(2),
        Number(iva).toFixed(2),
        Number(total).toFixed(2),
      ]
    );

    const pedidoId = result.insertId;

    // Insertar detalles del pedido
    const detallesValues = items.map(item => [
      pedidoId,
      item.producto_id ?? null,
      item.nombre_producto,
      item.categoria ?? '',
      item.cantidad,
      Number(item.precio_unitario).toFixed(2),
      Number(item.importe).toFixed(2),
    ]);

    await db.promise().query(
      `INSERT INTO detalles_pedido
        (pedido_id, producto_id, nombre_producto, categoria, cantidad, precio_unitario, importe)
       VALUES ?`,
      [detallesValues]
    );

    console.log(`✅ Pedido guardado: folio=${folio}, id=${pedidoId}`);
    res.status(201).json({ success: true, pedidoId });

  } catch (error) {
    console.error('Error al guardar pedido en BD:', error.message);
    res.status(500).json({ error: 'No se pudo guardar el pedido', detalle: error.message });
  }
}