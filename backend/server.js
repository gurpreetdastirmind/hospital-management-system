const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const patientRoutes = require('./routes/patients');
const departmentRoutes = require('./routes/departments');
const tokenRoutes = require('./routes/tokens');
const { initDatabase } = require('./database');
const staffRoutes = require('./routes/staff');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Dynamic CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  process.env.CORS_ORIGIN,
  'https://hospital-frontend-ts8w.onrender.com',
  'https://hospital-backend-xmnj.onrender.com'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initDatabase();

// Routes
app.use('/api/patients', patientRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/staff', staffRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    endpoints: {
      patients: '/api/patients',
      departments: '/api/departments',
      tokens: '/api/tokens',
      staff: '/api/staff'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Civil Hospital Registration API',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    endpoints: {
      'POST /api/patients/save': 'Save patient data',
      'GET /api/patients/:id': 'Get patient by ID',
      'GET /api/patients': 'Get all patients',
      'GET /api/departments': 'Get all departments',
      'POST /api/departments': 'Create department',
      'PUT /api/departments/:id': 'Update department',
      'PATCH /api/departments/:id/toggle': 'Toggle department status',
      'GET /api/tokens': 'Get all tokens',
      'POST /api/tokens/generate': 'Generate new token',
      'PUT /api/tokens/:id/status': 'Update token status',
      'GET /api/tokens/department/:department': 'Get tokens by department',
      'GET /api/tokens/stats/daily': 'Get daily statistics',
      'GET /api/health': 'Health check'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Database: SQLite3`);
  console.log(`📁 Database file: ./database/patients.db`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   - /api/patients`);
  console.log(`   - /api/departments`);
  console.log(`   - /api/tokens`);
  console.log(`   - /api/staff`);
  console.log(`   - /api/health`);
});