'use strict';

const cds = require('@sap/cds');
const express = require('express');
const helmet = require('helmet');
const path = require('path');

const authMiddleware = require('./src/middleware/auth');
const apiRouter = require('./src/routes/index');
const errorHandler = require('./src/middleware/errorHandler');

async function start() {
  const app = express();
  cds.app = app;

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json());
  app.use(authMiddleware);

  // Custom routes (demos, clients, dashboard, etc.) — /systems handled by CAP below
  app.use('/api', apiRouter);

  app.use(express.static(path.join(__dirname, 'public')));
  app.get(/^(?!\/api).*$/, (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  app.use(errorHandler);

  // Load pre-compiled CSN — avoids resolving '../db/schema' cross-dir import in CF
  const csn = require('./csn.json');
  cds.model = cds.compile.for.nodejs(csn);

  // Connect to HANA (reads credentials from VCAP_SERVICES in CF)
  cds.db = await cds.connect.to('db');

  // Mount CAP REST adapter for DemoService — .from(csn) bypasses file loading
  await cds.serve('DemoService').from(csn).with(require('./demo-service')).in(app);

  // Start HTTP server — CF sets PORT
  const port = process.env.PORT || 4004;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

start().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});
