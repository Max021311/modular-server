# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Database Management
- `yarn db:up` - Start PostgreSQL database using Docker Compose
- `yarn db:stop` - Stop PostgreSQL database
- `yarn db:run` - Complete database setup (start database + run migrations + seed data)
- `yarn db:migrate` - Run Knex database migrations
- `yarn db:seed` - Run database seeds (creates test user: example@example.com / password: loremipsum)

### Development Workflow
- `yarn dev` - Start development server with hot reload using nodemon
- `yarn build` - Compile TypeScript to JavaScript in ./build directory
- `yarn start` - Run compiled production server
- `yarn lint` - Run ESLint for code quality checks
- `yarn lint:fix` - Fix ESLint issues automatically

## Architecture Overview

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Web Framework**: Fastify with type-safe JSON schema validation
- **Database**: PostgreSQL with Knex.js query builder
- **Authentication**: JWT tokens with bcrypt password hashing
- **Development**: Nodemon for hot reload, ESLint for code quality

### Project Structure
```
src/
├── index.ts              # Application entry point, Fastify server setup
├── routes/               # API route definitions
│   ├── index.ts         # Route registration (plugin system)
│   └── user.ts          # User authentication endpoints
├── service/              # Business logic layer
│   ├── user.ts          # User operations (login, token verification)
│   └── jwt.ts           # JWT token management
├── prehandlers/          # Fastify middleware
│   └── verify-user-token.ts # JWT authentication middleware
├── common/              # Shared utilities
│   ├── bd.ts            # Knex database connection
│   ├── configuration.ts # Application configuration
│   ├── error.ts         # Custom error classes
│   └── logger.ts        # Pino logging configuration
├── migrations/          # Database schema migrations
├── seeds/              # Database seed data
└── types/              # TypeScript type definitions
```

### Database Schema
- **Users table**: id, name, user (email), password (bcrypt), permissions (array), timestamps
- Uses PostgreSQL triggers to preserve createdAt on updates
- Permissions system with array-based roles

### API Endpoints
- `GET /ok` - Health check endpoint
- `POST /user/auth` - Login endpoint (email/password → JWT token)  
- `GET /user/auth` - Protected endpoint requiring JWT authentication

### Authentication Flow
1. Login with email/password via `POST /user/auth`
2. Server validates credentials against Users table
3. Returns JWT token with user data and permissions
4. Protected routes use `verify-user-token` prehandler to validate JWT
5. Token payload includes: id, name, user, permissions, timestamps, scope

### Environment Configuration
Required environment variables:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME`, `DB_PASSWORD` - Database connection
- `DB_SSL` - Enable SSL for database connection  
- `JWT_SECRET` - Secret key for JWT signing (defaults to 'loremipsum')
- `PORT` - Server port (defaults to 8080)

### Type Safety
- Uses `@fastify/type-provider-json-schema-to-ts` for compile-time type safety
- JSON schemas define request/response types
- Custom TypeScript declarations extend Fastify interfaces