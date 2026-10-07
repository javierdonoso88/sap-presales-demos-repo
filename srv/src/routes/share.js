'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

const router = Router({ mergeParams: true });

const { getUserEmail } = require('../utils/user');

// ─── POST /demos/:id/share ────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const demoId = req.params.id;
    const token = uuidv4();
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    await query(
      `INSERT INTO SAP_PRESALES_DEMOS_SHARETOKENS (TOKEN, DEMO_ID, CREATEDAT, CREATEDBY, EXPIRESAT)
       VALUES (?, ?, ?, ?, ?)`,
      [token, demoId, now, userEmail, expiry]
    );

    res.json({ data: { token, expiresAt: expiry } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /share/:token ────────────────────────────────────────────────────────

router.get('/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const tokens = await query(
      `SELECT TOKEN, DEMO_ID, EXPIRESAT FROM SAP_PRESALES_DEMOS_SHARETOKENS WHERE TOKEN = ?`,
      [token]
    );

    if (!tokens || tokens.length === 0) {
      return res.status(404).json({ error: 'Share link not found' });
    }

    const st = tokens[0];
    if (new Date(st.EXPIRESAT) < new Date()) {
      return res.status(410).json({ error: 'Share link has expired' });
    }

    const demos = await query(
      `SELECT ID, TITLE, DESCRIPTION, DEMODATE, STATUS, TAGS, CREATEDAT, CREATEDBY
       FROM SAP_PRESALES_DEMOS_DEMOS WHERE ID = ?`,
      [st.DEMO_ID]
    );

    if (!demos || demos.length === 0) {
      return res.status(404).json({ error: 'Demo not found' });
    }

    const demo = demos[0];

    const systems = await query(
      `SELECT s.NAME, s.TYPE, s.LANDSCAPE, ds.NOTES
       FROM SAP_PRESALES_DEMOS_DEMOSYSTEMS ds
       JOIN SAP_PRESALES_DEMOS_SYSTEMS s ON s.ID = ds.SYSTEM_ID
       WHERE ds.DEMO_ID = ?`,
      [demo.ID]
    );

    const clients = await query(
      `SELECT c.NAME, c.INDUSTRY, dc.PRESENTATIONDATE, dc.RESULT
       FROM SAP_PRESALES_DEMOS_DEMOCLIENTS dc
       JOIN SAP_PRESALES_DEMOS_CLIENTS c ON c.ID = dc.CLIENT_ID
       WHERE dc.DEMO_ID = ?`,
      [demo.ID]
    );

    res.json({ data: { ...demo, systems, clients } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
