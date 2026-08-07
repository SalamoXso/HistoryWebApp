import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Chronicle Engine API'
  });
});

// Historical events endpoint
app.get('/api/events', (req, res) => {
  // Will return events from database
  res.json({
    success: true,
    data: [],
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Chronicle Engine Server running on http://localhost:${port}`);
  console.log(`📍 API: http://localhost:${port}/api`);
});