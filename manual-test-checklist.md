# 📝 Manual Test Checklist (Postman)

## 1. Authentication & Users
- [ ] Register user (POST `/api/auth/register`)
- [ ] Register user with google (POST `/api/auth/google`)
- [ ] User login (POST `/api/auth/login`)
- [ ] Google OAuth login (if applicable)
- [ ] Get authenticated user profile (GET `/api/users/me`)
- [ ] Update user data (PATCH `/api/users/:id`)
- [ ] Delete user (DELETE `/api/users/:id`)
- [ ] Validate access with and without JWT token

## 2. Sales
- [ ] Create sale (POST `/api/sales`)
- [ ] List active sales (GET `/api/sales/active`)
- [ ] Search sales with filters and pagination (GET `/api/sales?search=...&page=...`)
- [ ] Get sale details (GET `/api/sales/:id`)
- [ ] Reserve sale (POST `/api/sales/:id/reserve`)
- [ ] Mark sale as shipped (POST `/api/sales/:id/ship`)
- [ ] Confirm sale delivery (POST `/api/sales/:id/confirm-delivery`)
- [ ] Cancel sale (POST `/api/sales/:id/cancel`)
- [ ] Delete sale (DELETE `/api/sales/:id`)

## 3. Purchases
- [ ] Make a purchase (POST `/api/purchases`)
- [ ] List user purchases (GET `/api/purchases/user`)
- [ ] List purchases as seller (GET `/api/purchases/seller`)

## 4. Stores
- [ ] Create store (POST `/api/stores`)
- [ ] Get store by ID (GET `/api/stores/:id`)
- [ ] Update store branding (PATCH `/api/stores/:id/branding`)
- [ ] Search stores (GET `/api/stores?search=...`)

## 5. Favorites
- [ ] Add sale to favorites (POST `/api/favorites`)
- [ ] List user favorites (GET `/api/favorites/user`)
- [ ] Remove favorite (DELETE `/api/favorites/:saleId`)

## 6. Comments
- [ ] Add comment to sale or store (POST `/api/comments`)
- [ ] List comments for a sale (GET `/api/comments/sale/:saleId`)
- [ ] List comments for a store (GET `/api/comments/store/:storeId`)
- [ ] List comments directed to a user (GET `/api/comments/user/:userId`)

## 7. Subscriptions
- [ ] Get current subscription (GET `/api/subscriptions/current`)
- [ ] Change/upgrade subscription plan (POST `/api/subscriptions/upgrade`)
- [ ] List all subscription plans (GET `/api/subscriptions/plans`)

## 8. Notifications
- [ ] Receive notifications via WebSocket (check in frontend or with WS client)
- [ ] Mark notification as read (POST `/api/notifications/:id/read`)
- [ ] List user notifications (GET `/api/notifications/user`)
- [ ] Verify notification metadata is correct

## 9. Categories & Languages
- [ ] List categories (GET `/api/categories`)
- [ ] List languages (GET `/api/languages`)

## 10. Security & Headers
- [ ] Test endpoints with required headers and valid values
- [ ] Test endpoints with missing or invalid headers (should return 400/401)
- [ ] Test access to protected endpoints without token (should return 401)
- [ ] Test access to protected endpoints with invalid token (should return 401)

## 11. Responses & Errors
- [ ] Verify all successful responses use the standard format (`success`, `message`, `data`)
- [ ] Verify all errors use the standard format (`success: false`, `message`, `error`, `statusCode`) 