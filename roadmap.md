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
- ✅ Implement sales state management
  - ✅ Create sales_cancelled table
  - ✅ Modify sales table to only store active sales (available, reserved, shipped states)
  - ✅ Update sales service for state transitions
  - ✅ Implement cancellation logic with reason tracking
- ✅ Implement unified sales history endpoint
  - ✅ Create flexible filtering system
  - ✅ Implement pagination
  - ✅ Add status-based filtering
  - ✅ Optimize queries for performance
- ⬜ Enhance Purchases Management
  - ⬜ Implement detailed purchase view endpoint
    - ⬜ Add complete purchase information
    - ⬜ Include sale state history
    - ⬜ Add related comments
    - ⬜ Integrate notifications
    - ⬜ Add shipping information
  - ⬜ Improve existing purchase endpoints
    - ⬜ Add advanced filtering (date, status, price)
    - ⬜ Implement custom sorting
    - ⬜ Enhance pagination
    - ⬜ Add purchase statistics
  - ⬜ Optimize purchase history integration
    - ⬜ Improve sales-purchases data integration
    - ⬜ Add more detailed information
    - ⬜ Implement caching system
  - ⬜ Enhance security and validation
    - ⬜ Add strict state transition validation
    - ⬜ Improve role-based access control
    - ⬜ Implement subscription-based purchase limits
- ⬜ Performance Optimization
  - ⬜ Implement caching for history endpoints
  - ⬜ Optimize database queries
  - ⬜ Improve pagination for large datasets
  - ⬜ Add query performance monitoring
- ⬜ Documentation and Testing
  - ⬜ Update API documentation
  - ⬜ Add endpoint tests
  - ⬜ Document state transitions
  - ⬜ Add performance benchmarks

## 8. New Features (Based on Manual Testing)
- ⬜ Implement sales state transitions validation
  - ⬜ Add role-based validation (seller/buyer)
  - ⬜ Add state transition rules
  - ⬜ Implement validation middleware
- ⬜ Enhance sales history features
  - ⬜ Add date range filtering
  - ⬜ Add category/language filtering
  - ⬜ Implement search within history
  - ⬜ Add sorting options
- ⬜ Implement sales analytics
  - ⬜ Add sales performance metrics
  - ⬜ Implement sales trends analysis
  - ⬜ Add user activity statistics
- ⬜ Add bulk operations
  - ⬜ Bulk state updates
  - ⬜ Bulk cancellation
  - ⬜ Bulk export