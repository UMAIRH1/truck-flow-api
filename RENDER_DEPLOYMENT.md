# Render Deployment Guide

## Required Environment Variables

Set these in your Render dashboard under "Environment":

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
JWT_SECRET=your_secure_random_string_here
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your_secure_refresh_token_secret
JWT_REFRESH_EXPIRE=30d
```

## Build & Start Commands

- **Build Command**: `npm install`
- **Start Command**: `npm start`

## After Deployment

1. Visit `https://your-backend-url.onrender.com/seed` to create the manager account
2. Login with: `manager@truckflow.com` / `manager123`

## WebSocket Support

WebSocket connections are automatically handled by the server. Make sure your frontend has the correct `NEXT_PUBLIC_SOCKET_URL` pointing to your backend URL.
