import conexion from '../config/db.js';

export class UserService {
  async createUser(userData) {
    const { email, nombre, apellido, telefono } = userData;
    
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO usuarios (email, nombre, apellido, telefono) VALUES (?, ?, ?, ?)';
      const values = [email, nombre, apellido, telefono];
      
      conexion.query(query, values, (error, results) => {
        if (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            // User already exists, fetch and return existing user
            this.getUserByEmail(email)
              .then(existingUser => resolve(existingUser))
              .catch(err => reject(err));
            return;
          }
          console.error('Error creating user:', error);
          reject(error);
          return;
        }
        
        this.getUserById(results.insertId)
          .then(user => resolve(user))
          .catch(err => reject(err));
      });
    });
  }

  async getUserById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM usuarios WHERE id_usuario = ?';
      
      conexion.query(query, [id], (error, results) => {
        if (error) {
          console.error('Error fetching user by id:', error);
          reject(error);
          return;
        }
        
        if (results.length === 0) {
          reject(new Error('User not found'));
          return;
        }
        
        resolve(results[0]);
      });
    });
  }

  async getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM usuarios WHERE email = ?';
      
      conexion.query(query, [email], (error, results) => {
        if (error) {
          console.error('Error fetching user by email:', error);
          reject(error);
          return;
        }
        
        if (results.length === 0) {
          reject(new Error('User not found'));
          return;
        }
        
        resolve(results[0]);
      });
    });
  }

  async createOrUpdateUser(userData) {
    try {
      // Try to find existing user by email
      const existingUser = await this.getUserByEmail(userData.email);
      return existingUser;
    } catch (error) {
      // User doesn't exist, create new one
      return await this.createUser(userData);
    }
  }
}

export default new UserService();