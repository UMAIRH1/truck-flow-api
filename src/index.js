const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { initializeSocket } = require('./config/socket');
const { languageMiddleware } = require('./utils/i18n');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Security middleware (MUST be before routes)
app.use(helmet());
app.use(cors());

// Body parser
app.use(express.json());

// Language middleware (MUST be before routes)
app.use(languageMiddleware);

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Mount routers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const loadRoutes = require('./routes/loadRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const exportRoutes = require('./routes/exportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const seedRoutes = require('./routes/seedRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/loads', loadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/seed', seedRoutes); // Public seed endpoint

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`WebSocket server initialized`);
});
