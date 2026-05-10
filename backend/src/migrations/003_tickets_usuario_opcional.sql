-- Migración 003: hacer id_usuario opcional en tickets
-- Permite guardar tickets de compras sin usuario logueado

-- Primero quitar el FK constraint (el nombre puede variar, intentar ambos)
ALTER TABLE tickets DROP FOREIGN KEY IF EXISTS tickets_ibfk_1;

-- Hacer id_usuario nullable
ALTER TABLE tickets MODIFY COLUMN id_usuario INT DEFAULT NULL;
