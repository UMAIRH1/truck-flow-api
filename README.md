# TruckFlow Backend API

Backend API for TruckFlow - A logistics management platform for transport managers and drivers.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **User Management**: Manager and Driver roles with role-based access
- **Load Management**: Create, assign, track, and complete loads
- **Real-time Notifications**: WebSocket-based notifications using Socket.IO
- **Email System**: Password reset and driver invitation emails
- **File Upload**: Support for POD images, invoices, and documents via Cloudinary
- **Multi-language Support**: Backend translation system (English & Greek)
- **Dashboard Analytics**: Statistics and metrics for managers and drivers

## 📋 Prerequisites

- **Node.js**: v16 or higher
- **MongoDB**: v4.4 or higher (local or MongoDB Atlas)
- **npm** or **yarn**: Package manager

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd truckflow-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/truckflow
NODE_ENV=development

# Frontend URL for CORS and WebSocket
FRONTEND_URL=http://localhost:3000

# JWT Configuration (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your_strong_secret_key_here
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your_strong_refresh_secret_here
JWT_REFRESH_EXPIRE=30d

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=TruckFlow <your-email@gmail.com>
```

### 4. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# macOS: brew install mongodb-community
# Ubuntu: sudo apt-get install mongodb
# Windows: Download from mongodb.com

# Start MongoDB
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 5. Email Configuration (Gmail)

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable 2-Factor Authentication
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate an app password for "Mail"
5. Use this password in `EMAIL_PASSWORD` (not your Gmail password)

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

Server will start on `http://localhost:5000`

### Production Mode

```bash
npm start
```

## 📊 Seeding Database

Create initial manager account:

```bash
# Using the /seed endpoint
curl -X POST http://localhost:5000/api/seed
```

**Default Manager Credentials:**
- Email: `manager@truckflow.com`
- Password: `manager123`

## 📁 Project Structure

```
truckflow-backend/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── socket.js          # Socket.IO configuration
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   ├── loadController.js  # Load management
│   │   ├── userController.js  # User management
│   │   └── notificationController.js
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Load.js            # Load schema
│   │   ├── Notification.js    # Notification schema
│   │   └── OTP.js             # OTP schema
│   ├── routes/
│   │   ├── authRoutes.js      # Auth endpoints
│   │   ├── loadRoutes.js      # Load endpoints
│   │   ├── userRoutes.js      # User endpoints
│   │   └── notificationRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT verification
│   ├── services/
│   │   ├── emailService.js    # Email sending
│   │   └── notificationService.js
│   ├── utils/
│   │   └── i18n.js            # Translation utility
│   ├── locales/
│   │   ├── en.json            # English translations
│   │   └── el.json            # Greek translations
│   └── index.js               # App entry point
├── .env.example               # Environment template
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/driver` - Create driver (Manager only)
- `GET /api/users/drivers` - Get all drivers (Manager only)
- `DELETE /api/users/driver/:id` - Delete driver (Manager only)

### Loads
- `GET /api/loads` - Get all loads
- `POST /api/loads` - Create load (Manager only)
- `GET /api/loads/:id` - Get load by ID
- `PUT /api/loads/:id` - Update load (Manager only)
- `PATCH /api/loads/:id/assign` - Assign driver (Manager only)
- `PATCH /api/loads/:id/accept` - Accept load (Driver only)
- `PATCH /api/loads/:id/decline` - Decline load (Driver only)
- `POST /api/loads/:id/pod` - Upload POD (Driver only)
- `POST /api/loads/:id/documents` - Upload documents (Driver only)

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Dashboard
- `GET /api/dashboard/manager` - Manager dashboard stats
- `GET /api/dashboard/driver` - Driver dashboard stats

## 🔐 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 5000 |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `NODE_ENV` | Environment (development/production) | No | development |
| `FRONTEND_URL` | Frontend URL for CORS | Yes | - |
| `JWT_SECRET` | Access token secret | Yes | - |
| `JWT_EXPIRE` | Access token expiry | No | 15m |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes | - |
| `JWT_REFRESH_EXPIRE` | Refresh token expiry | No | 30d |
| `EMAIL_HOST` | SMTP host | Yes | - |
| `EMAIL_PORT` | SMTP port | Yes | - |
| `EMAIL_USER` | SMTP username | Yes | - |
| `EMAIL_PASSWORD` | SMTP password | Yes | - |
| `EMAIL_FROM` | From email address | Yes | - |

## 🧪 Testing

```bash
# Test API endpoints
curl http://localhost:5000/api/health

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/users/profile
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running (`mongod`)

### Email Not Sending
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Solution**: Use Gmail App Password, not your regular password

### CORS Error
```
Access to fetch at 'http://localhost:5000' has been blocked by CORS policy
```
**Solution**: Check `FRONTEND_URL` in `.env` matches your frontend URL

### WebSocket Connection Failed
```
WebSocket connection to 'ws://localhost:5000' failed
```
**Solution**: Make sure Socket.IO is properly configured and server is running

## 📝 Notes

- **JWT Secrets**: Change default secrets in production
- **MongoDB**: Use MongoDB Atlas for production
- **Email**: Gmail has sending limits (500 emails/day)
- **File Upload**: Files are stored in Cloudinary (configured in frontend)
- **WebSocket**: Uses Socket.IO for real-time notifications

## 🔄 Updates & Migrations

When updating the database schema:

1. Update the model in `src/models/`
2. No migration needed (MongoDB is schemaless)
3. Restart the server

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review API documentation
- Check server logs for errors

## 📄 License

[Your License Here]
