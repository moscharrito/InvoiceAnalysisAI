import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import invoiceRoutes from './routes/invoice';
import claimsRoutes from './routes/claims';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://invoice-analysis-frontend.vercel.app',
  'https://invoice-analysis-ai.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now, can restrict later
    }
  },
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ClaimScan API is running' });
});

// Routes
app.use('/api/invoice', invoiceRoutes);
app.use('/api/claims', claimsRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`ClaimScan API running on http://localhost:${PORT}`);
});

export default app;
