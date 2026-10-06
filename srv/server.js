'use strict';

const cds = require('@sap/cds');
const express = require('express');
const helmet = require('helmet');
const path = require('path');

const authMiddleware = require('./src/middleware/auth');
const apiRouter = require('./src/routes/index');
const errorHandler = require('./src/middleware/errorHandler');

// Mount custom Express middleware and routes during CAP bootstrap.
// Routes added here are checked BEFORE CAP's own service routes.
// Non-matching paths fall through to CAP (e.g. /api/systems → CAP).
cds.on('bootstrap', app => {
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json());

  // JWT auth applies to all routes (custom + CAP)
  app.use(authMiddleware);

  // Custom routes — systems handled by CAP, everything else here
  app.use('/api', apiRouter);

  // Static UI build
  app.use(express.static(path.join(__dirname, 'public')));

  // SPA fallback
  app.get(/^(?!\/api).*$/, (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.use(errorHandler);
});

module.exports = cds.server;
