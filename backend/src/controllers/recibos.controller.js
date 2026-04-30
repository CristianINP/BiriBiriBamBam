import db from '../config/db.js';
import { guardarRecibo, obtenerRecibosUsuario } from '../service/recibos.service.js';

export async function saveRecibo(req, res) {
  try {
    const { id_ticket, orderId, id_usuario, fecha_compra, metodo_pago, subtotal, impuestos, total, estado } = req.body;

    if (!id_ticket || !orderId || !id_usuario || !fecha_compra || !metodo_pago || !subtotal || !impuestos || !total) {
      return res.status(400).json({ error: 'Datos incompletos para guardar el recibo' });
    }

    const reciboId = await guardarRecibo({
      id_ticket,
      orderId,
      id_usuario,
      fecha_compra,
      metodo_pago,
      subtotal,
      impuestos,
      total,
      estado: estado || 'PENDIENTE'
    });

    console.log(`✅ Recibo guardado: id=${reciboId}`);
    res.status(201).json({ success: true, reciboId });
  } catch (error) {
    console.error('Error al guardar recibo:', error.message);
    res.status(500).json({ error: 'No se pudo guardar el recibo', detalle: error.message });
  }
}

export async function getRecibosUsuario(req, res) {
  try {
    const { id_usuario } = req.params;

    if (!id_usuario) {
      return res.status(400).json({ error: 'id_usuario es obligatorio' });
    }

    const recibos = await obtenerRecibosUsuario(id_usuario);

    res.status(200).json({ recibos });
  } catch (error) {
    console.error('Error al obtener recibos:', error.message);
    res.status(500).json({ error: 'No se pudieron obtener los recibos', detalle: error.message });
  }
}

export async function getReciboById(req, res) {
  try {
    const { id_recibo } = req.params;

    if (!id_recibo) {
      return res.status(400).json({ error: 'id_recibo es obligatorio' });
    }

    const [recibos] = await db.promise().query(
      'SELECT * FROM recibos WHERE id_recibo = ?',
      [id_recibo]
    );

    if (recibos.length === 0) {
      return res.status(404).json({ error: 'Recibo no encontrado' });
    }

    res.status(200).json({ recibo: recibos[0] });
  } catch (error) {
    console.error('Error al obtener recibo:', error.message);
    res.status(500).json({ error: 'No se pudo obtener el recibo', detalle: error.message });
  }
}
