# MasterPics Chat

A real-time chat application built with Node.js, Express, TypeScript, and Socket.IO.

## Features

- 🚀 Express.js server with TypeScript
- 🔄 Real-time communication with Socket.IO
- 🛡️ Rate limiting and security middleware
- 📝 Structured logging with Winston
- 🎨 Code formatting with Prettier
- 🔍 Linting with ESLint
- 🗄️ MongoDB integration ready
- 🔥 Firebase Admin SDK ready
- 🔐 JWT authentication ready

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (for database functionality)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration values.

## Development

Start the development server:
```bash
npm run dev
```

The server will start on port 8000 by default.

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run prod` - Start production server
- `npm run build` - Build the project for production
- `npm run lint` - Run ESLint
- `npm run lint-fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

## Project Structure

```
masterPicsChat/
├── src/
│   └── server.ts          # Main server file
├── logs/                  # Log files
├── dist/                  # Compiled JavaScript (after build)
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── nodemon.json
└── README.md
```

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check endpoint

## Socket.IO Events

- `join-room` - Join a chat room
- `send-message` - Send a message to a room
- `receive-message` - Receive a message from a room

## Environment Variables

See `.env.example` for all available environment variables.

## Production Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run prod
   ```

## Contributing

1. Follow the existing code style
2. Run linting and formatting before committing
3. Write meaningful commit messages

## License

ISC
