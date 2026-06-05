
-- TABLA ROLES
CREATE TABLE IF NOT EXISTS roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT
);

INSERT INTO roles (id_rol, nombre_rol, descripcion)
VALUES (1, 'ADMIN', 'Administrador del sistema')
ON CONFLICT (id_rol) DO NOTHING;

-- TABLA USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    telefono VARCHAR(20),
    id_rol INT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES roles(id_rol)
);

INSERT INTO usuarios
(
    id_usuario,
    nombre_completo,
    usuario,
    correo,
    password,
    telefono,
    id_rol,
    estado
)
VALUES
(
    1,
    'Administrador Principal',
    'admin',
    'admin@gmail.com',
    '$2b$10$5Ttxv30c5rrvIOz4rrTNS.3yg0.1QIzBk64rcXzNUTuiUrDMA4aNi',
    '55555555',
    1,
    'activo'
)
ON CONFLICT (id_usuario) DO NOTHING;

-- TABLA FAMILIAS
CREATE TABLE IF NOT EXISTS familias (
    id SERIAL PRIMARY KEY,
    nombre_jefe VARCHAR(150) NOT NULL,
    dpi VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(150),
    direccion TEXT,
    sector VARCHAR(100),
    estado VARCHAR(30) NOT NULL DEFAULT 'Activa',
    fecha_registro DATE DEFAULT CURRENT_DATE
);
