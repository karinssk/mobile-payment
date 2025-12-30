# Backend Setup

## Environment Variables

Create a `.env` file in the backend directory with the following:

```env
# Server
PORT=3001
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_PORT=8888
DB_USER=root
DB_PASSWORD=root
DB_NAME=mobile_installment

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_CHANNEL_SECRET=your_channel_secret_here

# Omise API Keys
OMISE_PUBLIC_KEY=pkey_xxxxx
OMISE_SECRET_KEY=skey_xxxxx

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## Installation

```bash
cd backend
npm install
```

## Run Development Server

```bash
npm run dev
```

## Database Setup

Run the SQL in `config/schema.sql` to create the required tables.
