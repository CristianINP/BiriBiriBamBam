import db from '../config/db.js';

export async function guardarRecibo(datos) {
  try {
    const { id_ticket, orderId, id_usuario, fecha_compra, metodo_pago, subtotal, impuestos, total, estado } = datos;

    const [result] = await db.promise().query(
      `INSERT INTO recibos (id_ticket, orderId, id_usuario, fecha_compra, metodo_pago, subtotal, impuestos, total, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_ticket,
        orderId,
        id_usuario,
        fecha_compra,
        metodo_pago,
        Number(subtotal).toFixed(2),
        Number(impuestos).toFixed(2),
        Number(total).toFixed(2),
        estado
      ]
    );

    return result.insertId;
  } catch (error) {
    console.error('Error en guardarRecibo:', error.message);
    throw error;
  }
}

export async function obtenerRecibosUsuario(id_usuario) {
  try {
    const [recibos] = await db.promise().query(
      `SELECT * FROM recibos WHERE id_usuario = ? ORDER BY created_at DESC`,
      [id_usuario]
    );

    return recibos;
  } catch (error) {
    console.error('Error en obtenerRecibosUsuario:', error.message);
    throw error;
  }
}
