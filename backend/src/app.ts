import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import rfqRoutes from './routes/rfq.routes.js';
import bidRoutes from './routes/bid.routes.js';

export const app = express();

// Global middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Health check
app.get('/', (_req, res) => {
  res.send('Hello World!');
});

// Route mounting
app.use('/auth', authRoutes);
app.use('/rfq', rfqRoutes);
app.use('/rfq', bidRoutes); // Handles /rfq/:rfqId/bid
