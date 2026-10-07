'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

const router = Router();

const { getUserEmail } = require('../utils/user');

// ─── GET /clients ─────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const rows = await query(`
      SELECT c.ID, c.NAME, c.INDUSTRY, c.COUNTRY, c.CONTACT, c.EMAIL,
             c.CREATEDAT, c.CREATEDBY, c.MODIFIEDAT, c.MODIFIEDBY,
             (SELECT COUNT(*) FROM SAP_PRESALES_DEMOS_DEMOCLIENTS WHERE CLIENT_ID = c.ID) AS DEMO_COUNT,
             (SELECT MAX(PRESENTATIONDATE) FROM SAP_PRESALES_DEMOS_DEMOCLIENTS WHERE CLIENT_ID = c.ID) AS LAST_PRESENTATION
      FROM SAP_PRESALES_DEMOS_CLIENTS c
      ORDER BY c.NAME
    `);
    res.json({ data: rows.map(r => ({ ...r, demoCount: Number(r.DEMO_COUNT) })) });
  } catch (err) {
    next(err);
  }
});

// ─── GET /clients/:id/stats ───────────────────────────────────────────────────

router.get('/:id/stats', async (req, res, next) => {
  try {
    const { id } = req.params;

    const byResult = await query(`
      SELECT RESULT, COUNT(*) AS CNT
      FROM SAP_PRESALES_DEMOS_DEMOCLIENTS
      WHERE CLIENT_ID = ?
      GROUP BY RESULT
      ORDER BY CNT DESC
    `, [id]);

    const demos = await query(`
      SELECT d.ID, d.TITLE, d.STATUS, d.DEMODATE, dc.PRESENTATIONDATE, dc.RESULT, dc.FEEDBACK
      FROM SAP_PRESALES_DEMOS_DEMOCLIENTS dc
      JOIN SAP_PRESALES_DEMOS_DEMOS d ON d.ID = dc.DEMO_ID
      WHERE dc.CLIENT_ID = ?
      ORDER BY dc.PRESENTATIONDATE DESC NULLS LAST
    `, [id]);

    res.json({
      data: {
        byResult: byResult.map(r => ({ result: r.RESULT, count: Number(r.CNT) })),
        demos,
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /clients ────────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const { name, industry, country, contact, email } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await query(
      `INSERT INTO SAP_PRESALES_DEMOS_CLIENTS
       (ID, NAME, INDUSTRY, COUNTRY, CONTACT, EMAIL, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, industry, country, contact, email, now, userEmail, now, userEmail]
    );

    const rows = await query(`SELECT * FROM SAP_PRESALES_DEMOS_CLIENTS WHERE ID = ?`, [id]);
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /clients/:id ─────────────────────────────────────────────────────────

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, industry, country, contact, email } = req.body;
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await query(
      `UPDATE SAP_PRESALES_DEMOS_CLIENTS
       SET NAME = ?, INDUSTRY = ?, COUNTRY = ?, CONTACT = ?, EMAIL = ?, MODIFIEDAT = ?, MODIFIEDBY = ?
       WHERE ID = ?`,
      [name, industry, country, contact, email, now, userEmail, id]
    );

    const rows = await query(`SELECT * FROM SAP_PRESALES_DEMOS_CLIENTS WHERE ID = ?`, [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /clients/:id ──────────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const refs = await query(
      `SELECT COUNT(*) AS CNT FROM SAP_PRESALES_DEMOS_DEMOCLIENTS WHERE CLIENT_ID = ?`, [id]
    );
    if (Number(refs[0].CNT) > 0) {
      return res.status(409).json({ error: 'Client is referenced by one or more demos and cannot be deleted.' });
    }
    await query(`DELETE FROM SAP_PRESALES_DEMOS_CLIENTS WHERE ID = ?`, [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
