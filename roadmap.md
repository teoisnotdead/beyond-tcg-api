# 🗺️ Roadmap de Desarrollo

## 1. Configuración Inicial
- ✅ Crear archivo .env con variables esenciales
- ✅ Instalar dependencias faltantes
- ✅ Configurar TypeORM para PostgreSQL

## 2. Módulos Básicos
- ✅ Crear estructura de carpetas para módulos
- ✅ Implementar módulo de autenticación
- ✅ Configurar middleware de JWT
- ✅ Implementar módulo de usuarios

## 3. Funcionalidades Core
- ✅ Implementar OAuth2 con Google
- ✅ Configurar Cloudinary para imágenes
- ✅ Implementar sistema de suscripciones con planes escalonados (Free, Pro, Tienda)
  - ✅ Lógica de límites de ventas por plan
  - ✅ Validación de creación de tienda según plan
  - ⬜ Branding, estadísticas y destacados según plan
- ⬜ Configurar WebSockets para notificaciones

## 4. Módulos de Entidades
- ✅ Implementar módulos para tiendas (stores)
- ✅ Implementar módulos para ventas
- ⬜ Implementar módulos para compras
- ✅ Implementar módulos para categorías/idiomas
- ⬜ Implementar módulos para comentarios/favoritos

## 5. Reputación, Badges y Destacados
- ⬜ Implementar sistema de reputación para usuarios y tiendas
- ⬜ Implementar sistema de badges (insignias) para usuarios y tiendas
- ⬜ Endpoints y lógica para destacados en home (usuarios y tiendas)

## 6. Documentación y Finalización
- ✅ Configurar Swagger para API docs
- ✅ Implementar validaciones
- ⬜ Configurar tareas programadas (cron jobs, expiración de suscripciones, etc.)
- ⬜ Testing y optimización