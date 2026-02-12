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

// Removed NotificationModel.ensureTable().catch(...) to prevent startup crash if DB is not ready

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
app.use('/api/contracts', contractRoutes);app.use('/api/settings', settingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- SERVE FRONTEND (SINGLE DOMAIN) ---
// Serve static files from React build (frontend/dist)
// Assuming the structure on Plesk will be:
// /httpdocs
//   ├── backend (Node.js app)
//   ├── frontend_dist (React build result)
//   └── ...

// In Plesk, Application Root is /pub.dimensisuara.id, Startup File is backend/src/app.js
// So 'process.cwd()' is usually /pub.dimensisuara.id
// And 'frontend_dist' should be at /pub.dimensisuara.id/frontend_dist

const fs = require('fs');

let finalFrontendPath = null;
const possiblePaths = [
    // 1. Standard Plesk Structure (Application Root / frontend_dist)
    path.join(process.cwd(), 'frontend_dist'),
    
    // 2. Relative to this file (backend/src/app.js -> ../../frontend_dist)
    path.join(__dirname, '../../frontend_dist'),
    
    // 3. Fallback for local dev
    path.join(__dirname, '../../../frontend_dist'),
    
    // 4. Maybe inside backend?
    path.join(__dirname, '../frontend_dist')
];

for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        finalFrontendPath = p;
        console.log('Frontend found at:', p);
        break;
    }
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
    console.log('Frontend build not found. Checked paths:', possiblePaths);
    console.log('Running in API-only mode or check deployment structure.');
    
    // Friendly message for root
    app.get('/', (req, res) => {
        res.send('Backend API is running. Frontend build not found.');
    });
}

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
