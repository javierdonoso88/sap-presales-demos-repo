'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

const router = Router();

function getUserEmail(user) {
  return user.getEmail ? user.getEmail() : (user.email || 'unknown');
}

// ─── GET /systems ─────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const rows = await query(`
      SELECT ID, NAME, TYPE, LANDSCAPE, URL, DESCRIPTION, ACTIVE,
             CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY
      FROM SAP_PRESALES_DEMOS_SYSTEMS
      WHERE ACTIVE = TRUE
      ORDER BY NAME
    `);
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /systems/:id/stats ───────────────────────────────────────────────────

router.get('/:id/stats', async (req, res, next) => {
  try {
    const { id } = req.params;

    const summary = await query(`
      SELECT
        COUNT(DISTINCT ds.DEMO_ID) AS DEMO_COUNT,
        COUNT(dc.CLIENT_ID)        AS PRESENTATION_COUNT,
        SUM(CASE WHEN dc.RESULT IN ('VERY_INTERESTED','INTERESTED') THEN 1 ELSE 0 END) AS POSITIVE_COUNT
      FROM SAP_PRESALES_DEMOS_DEMOSYSTEMS ds
      JOIN SAP_PRESALES_DEMOS_DEMOS d ON d.ID = ds.DEMO_ID
      LEFT JOIN SAP_PRESALES_DEMOS_DEMOCLIENTS dc ON dc.DEMO_ID = ds.DEMO_ID
      WHERE ds.SYSTEM_ID = ?
    `, [id]);

    const demos = await query(`
      SELECT d.ID, d.TITLE, d.STATUS, d.DEMODATE,
             COUNT(dc.CLIENT_ID) AS PRESENTATION_COUNT
      FROM SAP_PRESALES_DEMOS_DEMOSYSTEMS ds
      JOIN SAP_PRESALES_DEMOS_DEMOS d ON d.ID = ds.DEMO_ID
      LEFT JOIN SAP_PRESALES_DEMOS_DEMOCLIENTS dc ON dc.DEMO_ID = ds.DEMO_ID
      WHERE ds.SYSTEM_ID = ?
      GROUP BY d.ID, d.TITLE, d.STATUS, d.DEMODATE
      ORDER BY d.DEMODATE DESC NULLS LAST
    `, [id]);

    const s = summary[0];
    const demoCount        = Number(s.DEMO_COUNT);
    const presentationCount = Number(s.PRESENTATION_COUNT);
    const positiveCount    = Number(s.POSITIVE_COUNT);
    const successRate = presentationCount > 0
      ? Math.round((positiveCount / presentationCount) * 100)
      : null;

    res.json({
      data: {
        demoCount,
        presentationCount,
        successRate,
        demos: demos.map(d => ({ ...d, presentationCount: Number(d.PRESENTATION_COUNT) })),
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /systems ────────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const { name, type, landscape, url, description } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await query(
      `INSERT INTO SAP_PRESALES_DEMOS_SYSTEMS
       (ID, NAME, TYPE, LANDSCAPE, URL, DESCRIPTION, ACTIVE, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?)`,
      [id, name, type, landscape, url || null, description || null, now, userEmail, now, userEmail]
    );

    const rows = await query(`SELECT * FROM SAP_PRESALES_DEMOS_SYSTEMS WHERE ID = ?`, [id]);
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /systems/:id ─────────────────────────────────────────────────────────

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, landscape, url, description } = req.body;
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await query(
      `UPDATE SAP_PRESALES_DEMOS_SYSTEMS
       SET NAME = ?, TYPE = ?, LANDSCAPE = ?, URL = ?, DESCRIPTION = ?, MODIFIEDAT = ?, MODIFIEDBY = ?
       WHERE ID = ?`,
      [name, type, landscape, url || null, description || null, now, userEmail, id]
    );

    const rows = await query(`SELECT * FROM SAP_PRESALES_DEMOS_SYSTEMS WHERE ID = ?`, [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'System not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /systems/:id ──────────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const refs = await query(
      `SELECT COUNT(*) AS CNT FROM SAP_PRESALES_DEMOS_DEMOSYSTEMS WHERE SYSTEM_ID = ?`, [id]
    );
    if (Number(refs[0].CNT) > 0) {
      return res.status(409).json({ error: 'System is referenced by one or more demos and cannot be deleted.' });
    }
    await query(`DELETE FROM SAP_PRESALES_DEMOS_SYSTEMS WHERE ID = ?`, [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
