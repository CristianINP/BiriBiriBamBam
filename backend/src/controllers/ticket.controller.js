import ticketService from '../services/ticket.service.js';

export const createTicket = async (req, res) => {
  try {
    const { orderId, id_usuario, metodo_pago, subtotal, impuestos, total, estado } = req.body;

    if (!orderId || !id_usuario || !subtotal || !impuestos || !total) {
      return res.status(400).json({
        error: 'Faltan datos requeridos para generar el ticket'
      });
    }

    const ticket = await ticketService.createTicket({
      orderId,
      id_usuario,
      metodo_pago: metodo_pago || 'PayPal',
      subtotal,
      impuestos,
      total,
      estado: estado || 'APROBADO'
    });

    res.status(201).json({
      message: 'Ticket generado exitosamente',
      ticket
    });
  } catch (error) {
    console.error('Error en createTicket:', error.message);
    res.status(500).json({
      error: 'No se pudo generar el ticket',
      detalle: error.message
    });
  }
};

export const getTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await ticketService.getTicketById(id);

    res.status(200).json(ticket);
  } catch (error) {
    console.error('Error en getTicket:', error.message);
    res.status(404).json({
      error: 'Ticket no encontrado',
      detalle: error.message
    });
  }
};

export const getTicketByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const ticket = await ticketService.getTicketByOrderId(orderId);

    res.status(200).json(ticket);
  } catch (error) {
    console.error('Error en getTicketByOrder:', error.message);
    res.status(404).json({
      error: 'Ticket no encontrado',
      detalle: error.message
    });
  }
};

export const getTicketsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const tickets = await ticketService.getTicketsByUserId(userId);

    res.status(200).json(tickets);
  } catch (error) {
    console.error('Error en getTicketsByUser:', error.message);
    res.status(500).json({
      error: 'No se pudieron obtener los tickets',
      detalle: error.message
    });
  }
};

export const getTicketWithDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await ticketService.getTicketWithDetails(id);

    res.status(200).json(ticket);
  } catch (error) {
    console.error('Error en getTicketWithDetails:', error.message);
    res.status(404).json({
      error: 'Ticket no encontrado',
      detalle: error.message
    });
  }
};

export const getUserPurchaseReport = async (req, res) => {
  try {
    const { userId } = req.params;

    const report = await ticketService.getUserPurchaseReport(userId);

    res.status(200).json(report);
  } catch (error) {
    console.error('Error en getUserPurchaseReport:', error.message);
    res.status(500).json({
      error: 'No se pudo generar el reporte',
      detalle: error.message
    });
  }
};
