# 🗺️ Roadmap de Desarrollo

## 1. Funcionalidad Core
- ✅ Autenticación y registro de usuarios
- ✅ Perfiles de usuario y roles
- ✅ Gestión de tiendas
- ✅ Gestión de productos/ventas
- ✅ Gestión de compras
- ✅ Módulos de categorías e idiomas
- ✅ Módulos de comentarios, favoritos y ratings

## 2. Flujo de Ventas y Compras
- ✅ Gestión de estados de ventas (reservar, enviar, entregar, cancelar, etc.)
  - ✅ Crear tabla sales_cancelled
  - ✅ Modificar tabla sales para solo almacenar ventas activas
  - ✅ Actualizar servicio de ventas para transiciones de estado
  - ✅ Implementar lógica de cancelación con registro de razones
- ✅ Endpoint unificado de historial de ventas/compras
  - ✅ Sistema flexible de filtrado
  - ✅ Paginación y metadatos
  - ✅ Filtrado por estado
  - ✅ Optimización de queries para rendimiento
- ✅ Endpoint de vista detallada de compras
  - ✅ Información completa de la compra
  - ✅ Historial de estados de la venta
  - ✅ Comentarios relacionados
  - ✅ Integración de notificaciones
  - ✅ Información de envío
- ✅ Mejorar endpoints de ventas/compras
  - ✅ Filtros avanzados (fecha, estado, precio, categoría, idioma, tienda, etc.)
  - ✅ Ordenamiento personalizado
  - ✅ Mejor paginación
  - ✅ Estadísticas de compras/ventas
- ✅ Integración de datos ventas-compras
  - ✅ Historial unificado
  - ✅ Información detallada
  - ⬜ Implementar sistema de caché (futuro)

## 3. Estadísticas y Métricas de Usuario
- ✅ Métricas básicas de ventas/compras (totales, promedios, conversión, envío)
- ✅ Dashboards personales de usuario/tienda
- ✅ Acceso a estadísticas según suscripción/rol

## 4. Seguridad y Validación
- ✅ Validación de transiciones de estado (middleware, reglas)
- ✅ Control de acceso basado en roles
- ⬜ Validación estricta de transiciones de estado (avanzado)
- ⬜ Límites de compra según suscripción

## 5. Optimización y Rendimiento
- ✅ Optimización de queries
- ✅ Paginación para grandes volúmenes de datos
- ⬜ Implementar caché para endpoints de historial/estadísticas
- ⬜ Monitoreo de rendimiento y benchmarks

## 6. Documentación y Testing
- ✅ Documentación Swagger/OpenAPI
- ✅ Documentar transiciones de estado
- ⬜ Agregar tests de endpoints/unitarios/E2E
- ⬜ Agregar guías de uso

## 7. Funcionalidades Avanzadas y Futuro (Postergado)
- Operaciones en lote (actualizaciones masivas, cancelaciones, exportación)
- Analítica avanzada y reportes
- Visualización de datos (gráficos, tablas resumen, exportación CSV/Excel)
- Analítica cruzada entre módulos
- Exportación/importación
- Optimización avanzada de estadísticas y caché

## 8. Sistema de Gamificación y Reconocimientos
- ✅ Gestión de badges (crear, actualizar, listar, eliminar)
- ✅ Asignar/remover badges a usuarios
- ✅ Asignar/remover badges a tiendas
- ✅ Listar badges de usuarios y tiendas
- ✅ Soporte de metadatos en la asignación de badges
- ✅ Documentación y validación de la API

> Analítica avanzada, operaciones en lote y visualización de datos quedan postergadas para una futura fase enfocada en dashboards administrativos y business intelligence. 