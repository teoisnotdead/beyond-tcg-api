# 🗺️ Development Roadmap

## 1. Initial Setup
- ✅ Create .env file with essential variables
- ✅ Install missing dependencies
- ✅ Configure TypeORM for PostgreSQL
- ✅ Implement migrations and initial data

## 2. Basic Modules
- ✅ Create folder structure for modules
- ✅ Implement authentication module
- ✅ Configure JWT middleware
- ✅ Implement users module

## 3. Core Features
- ✅ Implement OAuth2 with Google
- ✅ Configure Cloudinary for images
- ✅ Implement subscription system with tiered plans (Free, Pro, Store)
  - ✅ Sales limits logic per plan
  - ✅ Store creation validation by plan
  - ✅ Branding, statistics, and featured logic by plan (structure and features in migration)
- ✅ Configure WebSockets for notifications
- ✅ Refactor notifications for internationalization (i18n) and metadata handling
- ✅ Standardize API responses (global interceptor)
- ✅ Advanced header and environment validation

## 4. Entity Modules
- ✅ Implement stores module
- ✅ Implement sales module
- ✅ Implement purchases module
- ✅ Implement categories/languages modules
- ✅ Implement comments module
- ✅ Implement favorites module
- ✅ Implement flexible pagination and advanced filters in main endpoints
- ✅ Implement advanced search endpoints (free text, filters, pagination)

## 5. Reputation, Badges, and Featured
- ✅ Implement reputation system for users and stores (transaction ratings, validations, and averages)
- ✅ Implement endpoints and logic for featured users and stores on home
- ✅ Implement badges system for users and stores (structure, endpoints, automatic assignment, and documentation)

## 6. Documentation and Finalization
- ✅ Configure Swagger for API docs
- ✅ Implement validations
- ✅ Configure scheduled tasks (cron jobs, subscription expiration, etc.)
- ✅ Error handling improvements
- ✅ Refactor notifications for i18n and metadata
- ✅ API response standardization
- ⬜ Testing and optimization
  - ⬜ Unit tests
  - ⬜ E2E tests
  - ✅ Query optimization
  - ⬜ Cache implementation
  - ⬜ Additional endpoint documentation

## 7. Sales Management Enhancement
- ⬜ Implement sales state management
  - ⬜ Create sales_cancelled table
  - ⬜ Modify sales table to only store active sales (available, reserved, shipped states)
  - ⬜ Update sales service for state transitions
  - ⬜ Implement cancellation logic with reason tracking
- ⬜ Implement unified sales history endpoint
  - ⬜ Create flexible filtering system
  - ⬜ Implement pagination
  - ⬜ Add status-based filtering
  - ⬜ Optimize queries for performance
- ⬜ Implement user purchases endpoint
  - ⬜ Create dedicated purchases listing
  - ⬜ Add filtering and pagination
  - ⬜ Implement purchase details view
- ⬜ Update statistics system
  - ⬜ Modify statistics calculation for new structure
  - ⬜ Implement real-time statistics
  - ⬜ Add performance optimizations
- ⬜ Documentation and testing
  - ⬜ Update API documentation
  - ⬜ Add new endpoint tests
  - ⬜ Document state transitions
  - ⬜ Add performance benchmarks