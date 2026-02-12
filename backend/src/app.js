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
const SettingModel = require('./models/settingModel');
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
    app.get('*', async (req, res) => {
        // Skip API routes that might have fallen through
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ message: 'API Endpoint not found' });
        }
        
        const indexPath = path.join(finalFrontendPath, 'index.html');
        try {
            let html = fs.readFileSync(indexPath, 'utf8');
            
            // Inject SEO & Social Meta Tags
            try {
                const settings = await SettingModel.get();
                if (settings) {
                    const title = settings.seo_title || settings.company_name || 'Pubs Music';
                    const description = settings.seo_description || '';
                    const image = settings.social_image || settings.app_icon || '';
                    
                    // Construct absolute URL
                    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
                    const host = req.get('host');
                    const baseUrl = `${protocol}://${host}`;
                    
                    let imageUrl = '';
                    if (image) {
                        if (image.startsWith('http')) {
                            imageUrl = image;
                        } else {
                            // Ensure path starts with /
                            // If stored as 'uploads/...' make it '/uploads/...'
                            let cleanPath = image.replace(/\\/g, '/');
                            if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
                            imageUrl = `${baseUrl}${cleanPath}`;
                        }
                    }
                    
                    const metaTags = `
                        <!-- Injected SEO & Social Tags -->
                        <title>${title}</title>
                        <meta name="description" content="${description}" />
                        <meta property="og:type" content="website" />
                        <meta property="og:title" content="${title}" />
                        <meta property="og:description" content="${description}" />
                        <meta property="og:image" content="${imageUrl}" />
                        <meta property="og:url" content="${baseUrl}${req.originalUrl}" />
                        <meta name="twitter:card" content="summary_large_image" />
                        <meta name="twitter:title" content="${title}" />
                        <meta name="twitter:description" content="${description}" />
                        <meta name="twitter:image" content="${imageUrl}" />
                    `;
                    
                    // Replace <title>...<title> with comment to avoid duplicates
                    html = html.replace(/<title>.*?<\/title>/i, '');
                    // Insert new tags before </head>
                    html = html.replace(/<\/head>/i, `${metaTags}</head>`);
                }
            } catch (dbError) {
                console.error('Error fetching settings for SEO injection:', dbError);
                // Continue serving original HTML if DB fails
            }

            res.send(html);
        } catch (err) {
            console.error('Error reading index.html:', err);
            res.status(500).send('Error loading application');
        }
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
