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

// In CF deployment, demo-service.cds has 'using from ../db/schema' which is
// outside the srv/ deployment folder. Intercept cds.load('*') to return the
// pre-compiled CSN (built by 'cds build' and shipped as srv/csn.json) instead
// of scanning .cds files that would fail to resolve cross-directory imports.
const compiledCSN = require('./csn.json');
const _cdsLoad = cds.load;
cds.load = async function (files, options) {
  if (!files || files === '*') return compiledCSN;
  return _cdsLoad.call(this, files, options);
};

// cds.server fires 'bootstrap', connects to HANA DB, serves DemoService,
// and starts the HTTP listener on process.env.PORT — keeps the process alive.
cds.server({
  service: 'DemoService',
  with: require('./demo-service')
}).catch(err => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

