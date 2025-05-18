# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with NestJS
- User authentication with JWT
- Google OAuth integration
- User management with role-based access control
- Category management
- Language management
- Swagger API documentation
- Environment configuration
- Database integration with PostgreSQL and TypeORM
- WebSocket notifications module
- Subscription system with tiered plans (Free, Pro, Store)
- Store, sales, purchases, comments, and favorites modules
- Reputation and badges system for users and stores
- Flexible pagination, advanced filters, and search endpoints
- Roadmap in both English (`roadmap.md`) and Spanish (`roadmap.es.md`)

### Changed
- Migrated all documentation to English
- Updated project structure for better organization
- Refactored notifications to use only type and metadata (i18n ready)
- Standardized all API responses with a global interceptor
- Advanced header and environment validation
- Improved error handling and validation

### Fixed
- Environment variables configuration
- TypeORM connection issues

## [0.0.1] - 2024-05-10

### Added
- Project initialization
- Basic project structure
- Core dependencies installation 