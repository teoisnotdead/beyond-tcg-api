# Beyond TCG API

A modern API for a collectible card marketplace built with NestJS.

## Features

- 🔐 Authentication with JWT and Google OAuth
- 👥 User management with role-based access control
- 🏷️ Category management
- 🌐 Multi-language support
- 📝 Swagger API documentation
- 🔄 Real-time updates with WebSockets
- 📸 Image upload with Cloudinary
- 🔍 Advanced search capabilities

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- JWT Authentication
- Swagger/OpenAPI
- WebSockets
- Cloudinary

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

3. Create a `.env` file in the root directory with the following variables:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=beyond_game_tcg

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1d
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend
FRONTEND_URL=http://localhost:4200
```

4. Run the application:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

5. Access the API documentation at `http://localhost:3000/api/docs`

## API Documentation

The API documentation is available through Swagger UI at `/api/docs` when the application is running.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

- GitHub: [@teoisnotdead](https://github.com/teoisnotdead)
