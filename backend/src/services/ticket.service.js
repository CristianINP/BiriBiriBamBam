import conexion from '../config/db.js';

export class TicketService {
  async createTicket(ticketData) {
    const { orderId, id_usuario, metodo_pago, subtotal, impuestos, total, estado = 'APROBADO' } = ticketData;
    
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO tickets (orderId, id_usuario, fecha_compra, metodo_pago, subtotal, impuestos, total, estado)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)
      `;
      const values = [orderId, id_usuario, metodo_pago, subtotal, impuestos, total, estado];
      
      conexion.query(query, values, (error, results) => {
        if (error) {
          console.error('Error creating ticket:', error);
          reject(error);
          return;
        }
        
        this.getTicketById(results.insertId)
          .then(ticket => resolve(ticket))
          .catch(err => reject(err));
      });
    });
  }

  async getTicketById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM tickets WHERE id_ticket = ?';
      
      conexion.query(query, [id], (error, results) => {
        if (error) {
          console.error('Error fetching ticket by id:', error);
          reject(error);
          return;
        }
        
        if (results.length === 0) {
          reject(new Error('Ticket not found'));
          return;
        }
        
        resolve(results[0]);
      });
    });
  }

  async getTicketByOrderId(orderId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM tickets WHERE orderId = ?';
      
      conexion.query(query, [orderId], (error, results) => {
        if (error) {
          console.error('Error fetching ticket by orderId:', error);
          reject(error);
          return;
        }
        
        if (results.length === 0) {
          reject(new Error('Ticket not found'));
          return;
        }
        
        resolve(results[0]);
      });
    });
  }

  async getTicketsByUserId(userId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM tickets WHERE id_usuario = ? ORDER BY fecha_compra DESC';
      
      conexion.query(query, [userId], (error, results) => {
        if (error) {
          console.error('Error fetching tickets by user id:', error);
          reject(error);
          return;
        }
        
        resolve(results);
      });
    });
  }

  async getTicketWithDetails(ticketId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          t.id_ticket,
          t.orderId,
          t.id_usuario,
          u.nombre,
          u.apellido,
          u.email,
          u.telefono,
          t.fecha_compra,
          t.metodo_pago,
          t.subtotal,
          t.impuestos,
          t.total,
          t.estado
        FROM tickets t
        JOIN usuarios u ON t.id_usuario = u.id_usuario
        WHERE t.id_ticket = ?
      `;

      conexion.query(query, [ticketId], (error, results) => {
        if (error) {
          console.error('Error fetching ticket with details:', error);
          reject(error);
          return;
        }

        if (results.length === 0) {
          reject(new Error('Ticket not found'));
          return;
        }

        const ticket = results[0];
        ticket.productos = [];

        resolve(ticket);
      });
    });
  }

  async getUserPurchaseReport(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          u.id_usuario,
          CONCAT(u.nombre, ' ', u.apellido) AS cliente,
          u.email,
          COUNT(t.id_ticket) AS total_compras,
          SUM(t.total) AS gasto_total
        FROM usuarios u
        LEFT JOIN tickets t ON u.id_usuario = t.id_usuario
        WHERE u.id_usuario = ?
        GROUP BY u.id_usuario
      `;
      
      conexion.query(query, [userId], (error, results) => {
        if (error) {
          console.error('Error fetching user purchase report:', error);
          reject(error);
          return;
        }
        
        resolve(results[0]);
      });
    });
  }
}

export default new TicketService();