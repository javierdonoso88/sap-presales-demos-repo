'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const authMiddleware = require('./src/middleware/auth');
const apiRouter = require('./src/routes/index');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Security headers — CSP disabled, managed by approuter
app.use(helmet({ contentSecurityPolicy: false }));

// CORS
app.use(cors());

// JSON body parser
app.use(express.json());

// JWT auth on ALL routes
app.use(authMiddleware);

// API router
app.use('/api', apiRouter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback — any GET not starting with /api returns index.html
app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SAP Presales Demos API listening on port ${PORT}`);
});

module.exports = app;
