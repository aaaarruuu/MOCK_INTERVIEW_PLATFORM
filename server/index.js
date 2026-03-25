const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

dotenv.config();

['MONGODB_URI','JWT_SECRET','GEMINI_API_KEY'].forEach(k => {
  if (!process.env[k]) { console.error(`❌ Missing env var: ${k}`); process.exit(1); }
});

const app = express();

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const origins = (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map(s => s.trim());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use('/api/auth', rateLimit({ windowMs: 15*60*1000, max: 20, message: { message: 'Too many auth requests.' } }));
app.use('/api',      rateLimit({ windowMs: 60*1000,    max: 120, message: { message: 'Too many requests.' } }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(e  => { console.error('❌ MongoDB error:', e.message); process.exit(1); });
mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/interview', require('./routes/interview'));

app.get('/api/health', (req, res) => res.json({
  status: 'OK',
  timestamp: new Date().toISOString(),
  mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}));

app.use((req, res) => res.status(404).json({ message: `${req.method} ${req.originalUrl} not found` }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server → http://localhost:${PORT}/api`);
  console.log(`🌍 Env: ${process.env.NODE_ENV || 'development'}`);
});
process.on('SIGTERM', () => server.close(() => { mongoose.connection.close(); process.exit(0); }));
module.exports = app;
