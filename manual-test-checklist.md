# 📝 Manual Test Checklist (Postman)

## 1. Authentication & Users
- ✅ Register user (POST `/api/auth/register`)
- ✅ Register user with google (POST `/api/auth/google`)
- ✅ User login (POST `/api/auth/login`)
- ✅ Google OAuth login (if applicable)
- ✅ Get authenticated user profile (GET `/api/users/me`)
- ✅ Update user data (PATCH `/api/users/:id`)
- ✅ Delete user (DELETE `/api/users/:id`)
- ✅ Validate access with and without JWT token
- ✅ Get user by ID (GET `/api/users/:id`)
- ✅ Get all users (GET `/api/users`)
- ✅ Search users (GET `/api/users/search`)
- ✅ Get comments for user (GET `/api/users/:id/comments`)
- ✅ Get comments authored by user (GET `/api/users/:id/comments-authored`)
- ✅ Get user profile metadata (GET `/api/users/profile/metadata`)

## 2. Sales (PRIORIDAD: volver a probar)
- ⬜ Create sale (POST `/api/sales`)
- ⬜ List active sales (GET `/api/sales`)
- ⬜ Search sales with filters and pagination (GET `/api/sales?search=...&page=...`)
- ⬜ Get sale details (GET `/api/sales/:id`)
- ⬜ Reserve sale (POST `/api/sales/:id/reserve`)
- ⬜ Mark sale as shipped (POST `/api/sales/:id/ship`)
- ⬜ Confirm sale delivery (POST `/api/sales/:id/confirm-delivery`)
- ⬜ Cancel sale (POST `/api/sales/:id/cancel`)
- ⬜ Delete sale (DELETE `/api/sales/:id`)
- ⬜ Update sale (PATCH `/api/sales/:id`)
- ⬜ Get sales history (GET `/api/sales/history`)
  - ⬜ Test all filters (type, status, search, category, language, store, price, quantity, proofs, date range)
  - ⬜ Test pagination and sorting
  - ⬜ Verify related data (category, language, seller, buyer, store)
- ⬜ Test sales state transitions
  - ⬜ Verify role-based access (seller/buyer)
  - ⬜ Verify state transition rules
  - ⬜ Test cancellation with reason
  - ⬜ Verify notifications for state changes

## 3. Statistics & Dashboards (PRIORIDAD: volver a probar)
- ⬜ Get user statistics (GET `/api/sales/statistics/user`)
- ⬜ Get store statistics (GET `/api/sales/statistics/store`)
- ⬜ Test access by subscription/role

## 4. Badges & Gamification
- ⬜ List all badges (GET `/api/badges`)
- ⬜ List user badges (GET `/api/badges/user/:userId`)
- ⬜ List store badges (GET `/api/badges/store/:storeId`)
- ⬜ Create badge (POST `/api/badges`)
- ⬜ Update badge (PUT `/api/badges/:id`)
- ⬜ Assign badge to user (POST `/api/badges/user/:userId/:badgeId`)
- ⬜ Assign badge to store (POST `/api/badges/store/:storeId/:badgeId`)
- ⬜ Remove badge from user (DELETE `/api/badges/user/:userId/:badgeId`)
- ⬜ Remove badge from store (DELETE `/api/badges/store/:storeId/:badgeId`)

## 5. Purchases
- ⬜ Make a purchase (POST `/api/purchases`)
- ⬜ List user purchases (GET `/api/purchases/user`)
- ⬜ List purchases as seller (GET `/api/purchases/seller`)
- ⬜ Test purchase history integration with sales history
- ⬜ Verify purchase notifications

## 6. Stores
- ⬜ Create store (POST `/api/stores`)
- ⬜ Get store by ID (GET `/api/stores/:id`)
- ⬜ Update store branding (PATCH `/api/stores/:id/branding`)
- ⬜ Search stores (GET `/api/stores?search=...`)
- ⬜ Test store statistics with new sales structure
- ⬜ Verify store featured status based on sales performance

## 7. Favorites
- ⬜ Add sale to favorites (POST `/api/favorites`)
- ⬜ List user favorites (GET `/api/favorites/user`)
- ⬜ Remove favorite (DELETE `/api/favorites/:saleId`)
- ⬜ Test favorites with cancelled sales

## 8. Comments
- ⬜ Add comment to sale or store (POST `/api/comments`)
- ⬜ List comments for a sale (GET `/api/comments/sale/:saleId`)
- ⬜ List comments for a store (GET `/api/comments/store/:storeId`)
- ⬜ List comments directed to a user (GET `/api/comments/user/:userId`)
- ⬜ Test comments with cancelled sales

## 9. Subscriptions
- ⬜ Get current subscription (GET `/api/subscriptions/current`)
- ⬜ Change/upgrade subscription plan (POST `/api/subscriptions/upgrade`)
- ⬜ List all subscription plans (GET `/api/subscriptions/plans`)
- ⬜ Test sales limits with different subscription plans
- ⬜ Verify subscription expiration handling

## 10. Notifications
- ⬜ Receive notifications via WebSocket (check in frontend or with WS client)
- ⬜ Mark notification as read (POST `/api/notifications/:id/read`)
- ⬜ List user notifications (GET `/api/notifications/user`)
- ⬜ Verify notification metadata is correct
- ⬜ Test notifications for sales state changes
- ⬜ Verify i18n in notifications

## 11. Categories & Languages
- ⬜ List categories (GET `/api/categories`)
- ⬜ List languages (GET `/api/languages`)
- ⬜ Test category/language filtering in sales history

## 12. Security & Headers
- ⬜ Test endpoints with required headers and valid values
- ⬜ Test endpoints with missing or invalid headers (should return 400/401)
- ⬜ Test access to protected endpoints without token (should return 401)
- ⬜ Test access to protected endpoints with invalid token (should return 401)
- ⬜ Test role-based access control for sales state changes

## 13. Responses & Errors
- ✅ Verify all successful responses use the standard format (`success`, `message`, `data`)
- ✅ Verify all errors use the standard format (`success: false`, `message`, `error`, `statusCode`)
- ⬜ Test error handling for invalid state transitions
- ⬜ Verify error messages for role-based access violations

## 14. Performance & Optimization
- ⬜ Test sales history endpoint with large datasets
- ⬜ Verify query performance with multiple filters
- ⬜ Test concurrent requests for state changes
- ⬜ Monitor response times for enriched data
- ⬜ Test WebSocket connection stability 

## 15. Nuevos Casos de Prueba (Historial de Ventas)
- ⬜ Test date range filtering in sales history
  - ⬜ Filter by specific date
  - ⬜ Filter by date range
  - ⬜ Test with invalid date formats
  - ⬜ Test with future dates
- ⬜ Test category and language filtering
  - ⬜ Filter by single category
  - ⬜ Filter by multiple categories
  - ⬜ Filter by single language
  - ⬜ Filter by multiple languages
  - ⬜ Test with invalid category/language IDs
- ⬜ Test search functionality within history
  - ⬜ Search by title
  - ⬜ Search by description
  - ⬜ Search by seller name
  - ⬜ Search by buyer name
  - ⬜ Test with special characters
  - ⬜ Test with partial matches
- ⬜ Test sorting options
  - ⬜ Sort by date (ascending/descending)
  - ⬜ Sort by price (ascending/descending)
  - ⬜ Sort by status
  - ⬜ Sort by type (sale/purchase)
  - ⬜ Test combined sorting with filters

## 16. Nuevos Casos de Prueba (Validación de Estados)
- ⬜ Test role-based state transitions
  - ⬜ Verify seller-only transitions
  - ⬜ Verify buyer-only transitions
  - ⬜ Test unauthorized transitions
  - ⬜ Test with different user roles
- ⬜ Test state transition rules
  - ⬜ Verify valid state sequences
  - ⬜ Test invalid state transitions
  - ⬜ Test edge cases (e.g., cancelled to shipped)
  - ⬜ Test state transitions with quantity changes
- ⬜ Test cancellation scenarios
  - ⬜ Cancel with valid reason
  - ⬜ Cancel with invalid reason
  - ⬜ Test cancellation from different states
  - ⬜ Verify cancellation notifications
  - ⬜ Test cancellation impact on related entities

## 17. Nuevos Casos de Prueba (Integración y Rendimiento)
- ⬜ Test sales-purchases integration
  - ⬜ Verify purchase history in sales history
  - ⬜ Test filtering purchases in sales history
  - ⬜ Verify purchase details in history
  - ⬜ Test purchase notifications in history
- ⬜ Test state change notifications
  - ⬜ Verify notifications for each state change
  - ⬜ Test notification content accuracy
  - ⬜ Verify notification delivery timing
  - ⬜ Test notification i18n
- ⬜ Test performance scenarios
  - ⬜ Load test with 1000+ history items
  - ⬜ Test concurrent state changes (10+ requests)
  - ⬜ Measure response times with filters
  - ⬜ Test pagination with large datasets
  - ⬜ Verify cache effectiveness
- ⬜ Test statistics integration
  - ⬜ Verify statistics with new sales structure
  - ⬜ Test real-time statistics updates
  - ⬜ Verify statistics accuracy after state changes
  - ⬜ Test statistics with cancelled sales 