import userService from '../services/user.service.js';

export const registerUser = async (req, res) => {
  try {
    const { email, nombre, apellido, telefono } = req.body;

    if (!email || !nombre || !apellido) {
      return res.status(400).json({
        error: 'Email, nombre y apellido son obligatorios'
      });
    }

    const user = await userService.createOrUpdateUser({ email, nombre, apellido, telefono });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      usuario: user
    });
  } catch (error) {
    console.error('Error en registerUser:', error.message);
    res.status(500).json({
      error: 'No se pudo registrar el usuario',
      detalle: error.message
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email es obligatorio'
      });
    }

    const user = await userService.getUserByEmail(email);

    res.status(200).json({
      message: 'Login exitoso',
      usuario: user
    });
  } catch (error) {
    console.error('Error en loginUser:', error.message);
    res.status(404).json({
      error: 'Usuario no encontrado',
      detalle: error.message
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    res.status(200).json(user);
  } catch (error) {
    console.error('Error en getUserById:', error.message);
    res.status(404).json({
      error: 'Usuario no encontrado',
      detalle: error.message
    });
  }
};
