const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const pool = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const songRoutes = require('./routes/songRoutes');
const reportRoutes = require('./routes/reportRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const contractRoutes = require('./routes/contractRoutes');
const settingRoutes = require('./routes/settingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const writerRoutes = require('./routes/writerRoutes');
const creatorRoutes = require('./routes/creatorRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'connected', message: 'Database connected' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'disconnected', message: 'Database disconnected' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/writers', writerRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// --- SERVE FRONTEND (SINGLE DOMAIN) ---
// Serve static files from React build (frontend/dist)
// Assuming the structure on Plesk will be:
// /httpdocs
//   ├── backend (Node.js app)
//   ├── frontend_dist (React build result)
//   └── ...
const frontendPath = path.join(__dirname, '../../frontend_dist');

// ALSO Check if we are running in Plesk structure where frontend_dist might be in root
// On Plesk, document root is usually /httpdocs/backend/public, so ../../frontend_dist is correct if app.js is in /httpdocs/backend/src
// But let's add a fallback to check relative to root if needed.

const fs = require('fs');

// Try to find the correct path
let finalFrontendPath = null;
if (fs.existsSync(frontendPath)) {
    finalFrontendPath = frontendPath;
} else {
    // Fallback: maybe we are running locally or structure is different
    const altPath = path.join(__dirname, '../../../frontend_dist'); // Just in case
    if (fs.existsSync(altPath)) finalFrontendPath = altPath;
}

if (finalFrontendPath) {
    console.log('Serving frontend from:', finalFrontendPath);
    app.use(express.static(finalFrontendPath));

    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        // Skip API routes that might have fallen through
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ message: 'API Endpoint not found' });
        }
        res.sendFile(path.join(finalFrontendPath, 'index.html'));
    });
} else {
    console.log('Frontend build not found at:', frontendPath);
    console.log('Running in API-only mode or check deployment structure.');
    
    // Fallback for Plesk: If frontend is not found, it might be serving backend/public/index.html by default
    // We should try to serve a friendly message or nothing so it doesn't conflict
}

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
