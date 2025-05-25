# 🗺️ Roadmap de Desarrollo

## 1. Configuración Inicial
- ✅ Crear archivo .env con variables esenciales
- ✅ Instalar dependencias faltantes
- ✅ Configurar TypeORM para PostgreSQL
- ✅ Implementar sistema de migraciones y datos iniciales

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
  - ✅ Branding, estadísticas y destacados según plan (estructura y features en migración)
- ✅ Configurar WebSockets para notificaciones
- ✅ Refactorizar notificaciones para internacionalización (i18n) y manejo de metadata
- ✅ Estandarizar respuestas de API (interceptor global)
- ✅ Validación avanzada de headers y ambientes

## 4. Módulos de Entidades
- ✅ Implementar módulos para tiendas (stores)
- ✅ Implementar módulos para ventas
- ✅ Implementar módulos para compras
- ✅ Implementar módulos para categorías/idiomas
- ✅ Implementar módulos para comentarios
- ✅ Implementar módulo de favoritos
- ✅ Implementar paginación flexible y filtros avanzados en endpoints principales
- ✅ Implementar endpoints de búsqueda avanzada (texto libre, filtros, paginación)

## 5. Reputación, Badges y Destacados
- ✅ Implementar sistema de reputación para usuarios y tiendas (ratings por transacción, validaciones y promedio)
- ✅ Implementar endpoints y lógica para destacados en home (usuarios y tiendas)
- ✅ Implementar sistema de badges (insignias) para usuarios y tiendas (estructura, endpoints, asignación automática y documentación)

## 6. Documentación y Finalización
- ✅ Configurar Swagger para API docs
- ✅ Implementar validaciones
- ✅ Configurar tareas programadas (cron jobs, expiración de suscripciones, etc.)
- ✅ Mejora en manejo de errores
- ✅ Refactorización de notificaciones para i18n y metadata
- ✅ Estandarización de respuestas de API
- ⬜ Testing y optimización
  - ⬜ Tests unitarios
  - ⬜ Tests e2e
  - ✅ Optimización de queries
  - ⬜ Implementación de cache
  - ⬜ Documentación adicional de endpoints 

## 7. Mejora en Gestión de Ventas
- ✅ Implementar gestión de estados de ventas
  - ✅ Crear tabla sales_cancelled
  - ✅ Modificar tabla sales para solo almacenar ventas activas (estados available, reserved, shipped)
  - ✅ Actualizar servicio de ventas para transiciones de estado
  - ✅ Implementar lógica de cancelación con registro de razones
- ✅ Implementar endpoint unificado de historial de ventas
  - ✅ Crear sistema flexible de filtrado
  - ✅ Implementar paginación
  - ✅ Agregar filtrado por estado
  - ✅ Optimizar queries para rendimiento
- ⬜ Mejorar Gestión de Compras
  - ⬜ Implementar endpoint de vista detallada de compras
    - ⬜ Agregar información completa de la compra
    - ⬜ Incluir historial de estados de la venta
    - ⬜ Agregar comentarios relacionados
    - ⬜ Integrar notificaciones
    - ⬜ Agregar información de envío
  - ⬜ Mejorar endpoints de compras existentes
    - ⬜ Agregar filtros avanzados (fecha, estado, precio)
    - ⬜ Implementar ordenamiento personalizado
    - ⬜ Mejorar paginación
    - ⬜ Agregar estadísticas de compras
  - ⬜ Optimizar integración del historial
    - ⬜ Mejorar integración de datos ventas-compras
    - ⬜ Agregar información más detallada
    - ⬜ Implementar sistema de caché
  - ⬜ Mejorar seguridad y validación
    - ⬜ Agregar validación estricta de transiciones de estado
    - ⬜ Mejorar control de acceso basado en roles
    - ⬜ Implementar límites de compra según suscripción
- ⬜ Optimización de Rendimiento
  - ⬜ Implementar caché para endpoints de historial
  - ⬜ Optimizar consultas a base de datos
  - ⬜ Mejorar paginación para grandes conjuntos de datos
  - ⬜ Agregar monitoreo de rendimiento de consultas
- ⬜ Documentación y Testing
  - ⬜ Actualizar documentación de API
  - ⬜ Agregar tests de endpoints
  - ⬜ Documentar transiciones de estado
  - ⬜ Agregar benchmarks de rendimiento

## 8. Nuevas Funcionalidades (Basadas en Pruebas Manuales)
- ⬜ Implementar validación de transiciones de estado de ventas
  - ⬜ Agregar validación basada en roles (vendedor/comprador)
  - ⬜ Agregar reglas de transición de estados
  - ⬜ Implementar middleware de validación
- ⬜ Mejorar características del historial de ventas
  - ⬜ Agregar filtrado por rango de fechas
  - ⬜ Agregar filtrado por categoría/idioma
  - ⬜ Implementar búsqueda dentro del historial
  - ⬜ Agregar opciones de ordenamiento
- ⬜ Implementar análisis de ventas
  - ⬜ Agregar métricas de rendimiento de ventas
  - ⬜ Implementar análisis de tendencias
  - ⬜ Agregar estadísticas de actividad de usuario
- ⬜ Agregar operaciones en lote
  - ⬜ Actualizaciones de estado en lote
  - ⬜ Cancelaciones en lote
  - ⬜ Exportación en lote 