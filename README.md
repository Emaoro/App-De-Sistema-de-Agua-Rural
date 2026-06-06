# Sistema Gestión Agua Rural

Proyecto desarrollado para el curso de **Análisis de Sistemas I**.

## Descripción del proyecto

El Sistema de Gestión de Agua Rural es una aplicación web creada para apoyar la administración del servicio de agua en una comunidad rural.  
Su objetivo principal es llevar un mejor control de las familias registradas, incidencias reportadas, niveles de tanque, distribución del agua y reportes generales.

Este sistema permite que el comité o los encargados puedan organizar mejor la información y tomar decisiones de forma más ordenada.

## Problema identificado

En muchas comunidades rurales, el control del agua se realiza de forma manual, lo cual puede provocar problemas como:

- Falta de control de las familias registradas.
- Dificultad para conocer el estado del tanque.
- Reportes de fugas o fallas sin seguimiento.
- Mala organización en la distribución por sectores.
- Información dispersa o poco actualizada.

## Objetivo general

Desarrollar un sistema web que permita gestionar la información relacionada con el servicio de agua rural, ayudando al control de usuarios, familias, incidencias, tanques, distribución y reportes.

## Objetivos específicos

- Registrar y administrar familias de la comunidad.
- Controlar incidencias como fugas, fallas o problemas del servicio.
- Consultar y actualizar información de los tanques de agua.
- Organizar la distribución del agua por sectores.
- Generar reportes básicos para el comité.
- Mejorar la organización de la información del sistema.

## Módulos principales

### 1. Login
Permite el ingreso seguro al sistema mediante usuario y contraseña.

### 2. Dashboard
Muestra un resumen general del sistema, como familias registradas, incidencias, tanques y distribución.

### 3. Familias
Permite registrar, consultar, editar y administrar las familias de la comunidad.

### 4. Incidencias
Permite registrar reportes de fugas, fallas o problemas relacionados con el servicio de agua.

### 5. Tanques
Permite controlar el nivel del agua y el estado de los tanques.

### 6. Distribución
Permite organizar los horarios o sectores donde se distribuye el agua.

### 7. Reportes
Permite visualizar información importante para la toma de decisiones.

### 8. Configuración
Permite administrar opciones generales del sistema.

## Tecnologías utilizadas

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- PostgreSQL
- JWT para autenticación
- bcryptjs para encriptar contraseñas

## Estructura básica del proyecto

```bash
App-De-Sistema-de-Agua-Rural/
│
├── database/
│   └── Scripts de base de datos
│
├── frontend/
│   └── Archivos HTML, CSS y JavaScript
│
├── src/
│   └── Backend del sistema
│
├── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
