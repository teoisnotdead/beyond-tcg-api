# Beyond TCG API

A modern API for a collectible card marketplace built with NestJS.

## Features

### Authentication and Users
- 🔐 Authentication with JWT and Google OAuth2
- 👥 User management with role-based access control
- ⭐ Reputation system for users and stores
- 🏅 Badge system for users and stores

### Marketplace
- 🏪 Store system with tiered plans (Free, Pro, Store)
- 💰 Sales and purchases management
- 📊 Statistics and metrics per plan
- 🌟 Featured system for users and stores
- 💬 Comments and ratings system
- ❤️ Favorites system

### Content and Search
- 🏷️ Category management
- 🌐 Multi-language support
- 🔍 Advanced search with filters and pagination
- 📸 Image upload with Cloudinary
- 📱 Real-time notifications with WebSockets

### Technical
- 📝 API documentation with Swagger/OpenAPI
- 🔄 Migration system and initial data
- ⚡ Query optimization and error handling
- 🔒 Robust validations
- ⏰ Scheduled tasks (cron jobs)

## Tech Stack

- **Backend Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT, Google OAuth2
- **Documentation**: Swagger/OpenAPI
- **Real-time Communication**: WebSockets
- **Image Storage**: Cloudinary
- **Task Management**: Cron Jobs

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/teoisnotdead/beyond-tcg-api.git
cd beyond-tcg-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory based on [.env.example](.env.example)

4. Run migrations:
```bash
npm run migration:run
```

5. Start the application:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

6. Access the API documentation at `http://localhost:3000/api/docs`

## Subscription Plans

The system includes three subscription tiers:

- **Free**: Basic plan with limited features
- **Pro**: Intermediate plan with additional features
- **Store**: Complete plan with all features

Each plan includes different limits and specific features for sales, branding, and statistics.

## API Documentation

Complete API documentation is available through Swagger UI at `/api/docs` when the application is running.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Project Status

The project is under active development. Check the [Roadmap[EN]](roadmap.md), [Roadmap[ES]](roadmap.es.md) and [Changelog](CHANGELOG.md) for more information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

- GitHub: [@teoisnotdead](https://github.com/teoisnotdead)
