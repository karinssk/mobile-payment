require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import database connection
const { testConnection } = require('./config/database');

// Import routes
const customerRoutes = require('./routes/customerRoutes');
const installmentRoutes = require('./routes/installmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const lineRoutes = require('./routes/lineRoutes');

// Import cron jobs
const { scheduleNotificationJob } = require('./jobs/notificationCron');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Important: LINE webhook needs raw body for signature verification
// So we apply JSON parser to all routes except LINE webhook
app.use('/api', express.json());
app.use('/api', express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'mobile-installment-backend'
  });
});

// API Routes
app.use('/api/customers', customerRoutes);
app.use('/api/installments', installmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/line', lineRoutes);

// LINE Webhook (needs special handling for raw body)
app.use('/webhook', lineRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // LINE webhook signature verification error
  if (err.message.includes('signature')) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid LINE signature' 
    });
  }
  
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Schedule cron jobs
    scheduleNotificationJob();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║     📱 Mobile Installment Notification System             ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}               ║
║  Environment: ${process.env.NODE_ENV || 'development'}                            ║
╠═══════════════════════════════════════════════════════════╣
║  API Endpoints:                                           ║
║  • GET  /health                - Health check             ║
║  • /api/customers              - Customer CRUD            ║
║  • /api/installments           - Installment CRUD         ║
║  • /api/payments               - Payment management       ║
║  • /api/line                   - LINE integration         ║
║  • POST /webhook/webhook       - LINE webhook             ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
