'use strict';

const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

const router = Router();

function getUserEmail(user) {
  return user.getEmail ? user.getEmail() : (user.email || 'unknown');
}

function normalizeSystem(row) {
  return { ...row, ACTIVE: row.ACTIVE === 1 || row.ACTIVE === true };
}

// ─── GET /systems ─────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const { active, type, landscape } = req.query;
    let sql = `SELECT ID, NAME, TYPE, LANDSCAPE, URL, DESCRIPTION, ACTIVE, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY
               FROM SAP_PRESALES_DEMOS_SYSTEMS`;
    const params = [];
    const conditions = [];

    if (active === 'true') conditions.push(`ACTIVE = 1`);
    if (type) { conditions.push(`TYPE = ?`); params.push(type); }
    if (landscape) { conditions.push(`LANDSCAPE = ?`); params.push(landscape); }

    if (conditions.length > 0) sql += ` WHERE ` + conditions.join(' AND ');
    sql += ` ORDER BY LANDSCAPE, TYPE, NAME`;

    const rows = await query(sql, params);
    res.json({ data: rows.map(normalizeSystem) });
  } catch (err) {
    next(err);
  }
});

// ─── POST /systems ────────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const { name, type, landscape, url, description, active = true } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await query(
      `INSERT INTO SAP_PRESALES_DEMOS_SYSTEMS
       (ID, NAME, TYPE, LANDSCAPE, URL, DESCRIPTION, ACTIVE, CREATEDAT, CREATEDBY, MODIFIEDAT, MODIFIEDBY)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, type, landscape || null, url || null, description || null, active ? 1 : 0, now, userEmail, now, userEmail]
    );

    const rows = await query(`SELECT * FROM SAP_PRESALES_DEMOS_SYSTEMS WHERE ID = ?`, [id]);
    res.status(201).json({ data: normalizeSystem(rows[0]) });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /systems/:id ─────────────────────────────────────────────────────────

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, landscape, url, description, active } = req.body;
    const now = new Date().toISOString();
    const userEmail = getUserEmail(req.user);

    await query(
      `UPDATE SAP_PRESALES_DEMOS_SYSTEMS
       SET NAME = ?, TYPE = ?, LANDSCAPE = ?, URL = ?, DESCRIPTION = ?, ACTIVE = ?, MODIFIEDAT = ?, MODIFIEDBY = ?
       WHERE ID = ?`,
      [name, type, landscape || null, url || null, description || null, active ? 1 : 0, now, userEmail, id]
    );

    const rows = await query(`SELECT * FROM SAP_PRESALES_DEMOS_SYSTEMS WHERE ID = ?`, [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'System not found' });
    res.json({ data: normalizeSystem(rows[0]) });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /systems/:id ──────────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const refs = await query(
      `SELECT COUNT(*) AS CNT FROM SAP_PRESALES_DEMOS_DEMOSYSTEMS WHERE SYSTEM_ID = ?`,
      [id]
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
